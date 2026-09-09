declare module "@paystack/inline-js" {
  type PaystackTransaction = {
    reference: string;
    status: string;
    message: string;
    trans: string;
    transaction: string;
    trxref: string;
  };

  type NewTransactionOptions = {
    key: string;
    email: string;
    amount: number;
    reference?: string;
    currency?: string;
    channels?: string[];
    onSuccess?: (transaction: PaystackTransaction) => void;
    onCancel?: () => void;
    onError?: (error: { message: string }) => void;
  };

  export default class PaystackPop {
    newTransaction(options: NewTransactionOptions): void;
  }
}
