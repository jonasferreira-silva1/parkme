// =============================================================
// AUTH SERVICE — Lógica de autenticação
// Responsável por: registro, login e renovação de tokens.
// Segue o princípio de responsabilidade única (SRP).
// =============================================================

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // -----------------------------------------------------------
  // Registra um novo usuário no sistema
  // -----------------------------------------------------------
  async register(dto: RegisterDto) {
    // Verifica se o e-mail já está em uso
    const usuarioExistente = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (usuarioExistente) {
      throw new ConflictException('Este e-mail já está cadastrado');
    }

    // Gera o hash da senha (custo 10 = bom equilíbrio segurança/velocidade)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Cria o usuário no banco
    const usuario = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        pcd: dto.pcd ?? false,
      },
      // Retorna apenas os campos necessários (nunca retorna a senha!)
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    this.logger.log(`Novo usuário registrado: ${usuario.email}`);

    // Gera os tokens para o usuário já fazer login após o registro
    const tokens = await this.gerarTokens(usuario.id, usuario.email, usuario.role);

    return { usuario, ...tokens };
  }

  // -----------------------------------------------------------
  // Autentica o usuário com e-mail e senha
  // -----------------------------------------------------------
  async login(dto: LoginDto) {
    // Busca o usuário pelo e-mail
    const usuario = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Mensagem genérica para não revelar se o e-mail existe
    const erroCrendenciais = new UnauthorizedException('E-mail ou senha incorretos');

    if (!usuario) {
      throw erroCrendenciais;
    }

    // Compara a senha enviada com o hash salvo no banco
    const senhaCorreta = await bcrypt.compare(dto.password, usuario.passwordHash);

    if (!senhaCorreta) {
      throw erroCrendenciais;
    }

    this.logger.log(`Login: ${usuario.email}`);

    const tokens = await this.gerarTokens(usuario.id, usuario.email, usuario.role);

    return {
      usuario: {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
      },
      ...tokens,
    };
  }

  // -----------------------------------------------------------
  // Gera novos tokens usando o refresh token
  // -----------------------------------------------------------
  async refresh(userId: string, email: string, role: string) {
    return this.gerarTokens(userId, email, role);
  }

  // -----------------------------------------------------------
  // MÉTODO PRIVADO: Gera access token e refresh token
  // -----------------------------------------------------------
  private async gerarTokens(userId: string, email: string, role: string) {
    // Payload que ficará dentro dos tokens
    const payload = { sub: userId, email, role };

    // Access token: expira rápido (15 minutos por padrão)
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m') as any,
    });

    // Refresh token: dura mais (7 dias), usado para renovar o access token
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any,
    });

    return { accessToken, refreshToken };
  }
}
