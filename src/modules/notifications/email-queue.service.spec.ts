import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_JOB_NAMES, EMAIL_QUEUE } from '../../queue';
import { EmailQueueService } from './email-queue.service';

/**
 * Suite unitaria para EmailQueueService.
 *
 * Verifica que el servicio delega correctamente a BullMQ
 * sin requerir Redis real durante la prueba.
 */
describe('EmailQueueService', () => {
  let service: EmailQueueService;
  const addMock = jest.fn();

  beforeEach(async () => {
    addMock.mockResolvedValue({ id: 'job-123' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailQueueService,
        {
          provide: getQueueToken(EMAIL_QUEUE),
          useValue: {
            add: addMock,
          } satisfies Partial<Queue>,
        },
      ],
    }).compile();

    service = module.get<EmailQueueService>(EmailQueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Verifica que el email de verificacion se encola con el nombre esperado.
   */
  it('should_enqueue_verification_email_when_payload_is_valid', async () => {
    await service.enqueueVerificationEmail({
      to: 'user@example.com',
      name: 'Jair',
      verificationUrl: 'https://example.com/verify?token=abc',
    });

    expect(addMock).toHaveBeenCalledWith(
      EMAIL_JOB_NAMES.SEND_VERIFICATION,
      {
        to: 'user@example.com',
        name: 'Jair',
        verificationUrl: 'https://example.com/verify?token=abc',
      },
      expect.objectContaining({
        jobId: expect.stringContaining(EMAIL_JOB_NAMES.SEND_VERIFICATION),
      }),
    );
  });
});
