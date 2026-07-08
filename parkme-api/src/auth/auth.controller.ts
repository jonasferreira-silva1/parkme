// =============================================================
// AUTH CONTROLLER — Rotas de autenticação
// Apenas recebe as requisições, valida os dados e delega
// toda a lógica para o AuthService (separação de responsabilidades).
// =============================================================

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './decorators/current-user.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

// Agrupa as rotas sob a tag "Auth" no Swagger
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register — Cria uma nova conta
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /auth/login — Faz login e retorna os tokens
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login e obter tokens JWT' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // POST /auth/refresh — Renova o access token usando o refresh token
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh')) // Usa a estratégia de refresh
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token com refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens renovados' })
  async refresh(@CurrentUser() user: any) {
    return this.authService.refresh(user.sub, user.email, user.role);
  }

  // GET /auth/me — Retorna os dados do usuário logado (rota de teste)
  @Post('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter dados do usuário autenticado' })
  async me(@CurrentUser() user: any) {
    return user;
  }

  // GET /auth/users — Lista todos os usuários (apenas OPERATOR e ADMIN)
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OPERATOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar usuários do sistema' })
  @ApiQuery({ name: 'role', required: false, example: 'DRIVER' })
  async listUsers(@Query('role') role?: string) {
    return this.authService.listUsers(role);
  }
}
