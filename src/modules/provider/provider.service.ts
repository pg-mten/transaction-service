import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NetzmeService {
  async createTransaction(payload: {
    transaction_id: string;
    amount: string;
    method: string;
    callback_url: string;
    metadata?: any;
  }) {
    return axios.post('https://api.netzme.com/payment/charge', {
      transaction_id: payload.transaction_id,
      amount: payload.amount,
      method: payload.method,
      callback_url: payload.callback_url,
      metadata: payload.metadata,
    });
  }

  // Tambahan jika ada API lain dari Netzme bisa ditambahkan di sini
}
