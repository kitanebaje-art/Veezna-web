import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      applicationId,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !applicationId) {
      return NextResponse.json({ error: 'Invalid payment parameters' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: 'Server secret unconfigured' }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // Update Application Status in Firestore
    const appRef = doc(db, 'admissions', applicationId);
    await updateDoc(appRef, {
      status: 'payment_verified',
      updatedAt: serverTimestamp(),
      'payment.status': 'paid',
      'payment.razorpayOrderId': razorpay_order_id,
      'payment.razorpayPaymentId': razorpay_payment_id,
      'payment.verifiedAt': new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Payment successfully verified' });
  } catch (error: any) {
    console.error('Verify Payment Error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}