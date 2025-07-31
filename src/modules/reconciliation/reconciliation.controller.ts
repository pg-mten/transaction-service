import { Controller } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';

@Controller()
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}
}
