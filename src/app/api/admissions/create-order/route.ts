import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { PROGRAMS, GENERAL_DISCOUNT } from '@/lib/programs';

export async function POST(req: Request) {
  try {
    const { programId, applicationId } = await req.json();

    if (!programId || !applicationId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const program = PROGRAMS.find((p) => p.id === programId);
    if (!program) {
      return NextResponse.json({ error: 'Invalid Program selected' }, { status: 400 });
    }

    // Server-side Recalculation
    const totalFee = program.fee + program.registrationFee;
    const netPayable = Math.max(0, totalFee - GENERAL_DISCOUNT);
    const amountInPaisa = netPayable * 100;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured on server' },
        { status: 500 }
      );
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: amountInPaisa,
      currency: 'INR',
      receipt: `rcpt_${applicationId.substring(0, 20)}`,
      notes: {
        applicationId,
        programId: program.id,
      },
    };

    const order = await instance.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error: any) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}