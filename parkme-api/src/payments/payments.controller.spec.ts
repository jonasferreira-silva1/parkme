import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;
  let originalEnv: string | undefined;

  const mockPaymentsService = {
    criarPagamento: jest.fn(),
    buscarPagamento: jest.fn(),
    processarWebhook: jest.fn(),
    confirmarPagamentoManual: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('confirmarDev', () => {
    it('should throw ForbiddenException if NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';

      expect(() => controller.confirmarDev('payment_123')).toThrow(
        ForbiddenException,
      );
      expect(service.confirmarPagamentoManual).not.toHaveBeenCalled();
    });

    it('should proceed and call service if NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';

      const result = await controller.confirmarDev('payment_123');

      expect(result).toEqual({ success: true });
      expect(service.confirmarPagamentoManual).toHaveBeenCalledWith(
        'payment_123',
      );
    });

    it('should proceed and call service if NODE_ENV is undefined/other than production', async () => {
      process.env.NODE_ENV = 'test';

      const result = await controller.confirmarDev('payment_123');

      expect(result).toEqual({ success: true });
      expect(service.confirmarPagamentoManual).toHaveBeenCalledWith(
        'payment_123',
      );
    });
  });
});
