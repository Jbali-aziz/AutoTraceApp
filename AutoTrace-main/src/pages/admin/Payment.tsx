
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  WalletCards, 
  WalletMinimal, 
  Receipt, 
  BadgeDollarSign,
  ShieldCheck,
  UserCog,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";

interface PaymentFormProps {
  plan?: { name: string; price: number };
}

const PaymentForm: React.FC<PaymentFormProps> = ({ plan }) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');

  const handlePay = () => {
    toast.success('Payment successful!');
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6">
      <div className="flex-1 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Complete your payment</CardTitle>
            <CardDescription>
              {plan ? (
                <>
                  You are upgrading to the <span className="font-semibold">{plan.name}</span> plan for <span className="font-semibold">{plan.price} DT/month</span>.
                </>
              ) : (
                <span className="text-red-500">No plan selected. Please select a plan first.</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex gap-4 justify-center mb-4">
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className={`flex-1 py-3 text-base font-semibold ${paymentMethod === 'card' ? 'shadow-md' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="mr-2" /> Credit Card
                </Button>
                <Button
                  variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                  className={`flex-1 py-3 text-base font-semibold ${paymentMethod === 'bank' ? 'shadow-md' : ''}`}
                  onClick={() => setPaymentMethod('bank')}
                >
                  <WalletMinimal className="mr-2" /> Bank Transfer
                </Button>
              </div>
            </div>
            {paymentMethod === 'card' && (
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); handlePay(); }}>
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input id="cardName" placeholder="John Doe" value={cardName} onChange={e => setCardName(e.target.value)} required />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} required />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" value={cvv} onChange={e => setCvv(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Main St" value={address} onChange={e => setAddress(e.target.value)} required />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Tunis" value={city} onChange={e => setCity(e.target.value)} required />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="1000" value={zip} onChange={e => setZip(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" placeholder="Tunisia" value={country} onChange={e => setCountry(e.target.value)} required />
                </div>
                <Button className="w-full mt-4" type="submit">{plan ? `Pay ${plan.price} DT` : 'Pay'}</Button>
              </form>
            )}
            {paymentMethod === 'bank' && (
              <div className="py-8 px-6 bg-fleet-50 border border-fleet-200 rounded-lg flex flex-col items-center max-w-xl mx-auto shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-fleet-600">Bank Transfer Details</h3>
                <div className="w-full text-left space-y-2 mb-6">
                  <div><span className="font-semibold">Bank Name:</span> Banque de Tunisie</div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Account Number:</span>
                    <span id="account-number">1234567890123456</span>
                    <Button size="sm" variant="ghost" onClick={() => {navigator.clipboard.writeText('1234567890123456')}}>Copy</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">IBAN:</span>
                    <span id="iban">TN5904018104000000012345</span>
                    <Button size="sm" variant="ghost" onClick={() => {navigator.clipboard.writeText('TN5904018104000000012345')}}>Copy</Button>
                  </div>
                  <div><span className="font-semibold">Beneficiary:</span> Autotrace Solutions</div>
                  <div><span className="font-semibold">Reference:</span> Your email or Company Name</div>
                </div>
                <form className="w-full space-y-4" onSubmit={e => {e.preventDefault(); toast.success('Bank transfer details submitted!');}}>
                  <div>
                    <Label htmlFor="senderName">Sender Name</Label>
                    <Input id="senderName" name="senderName" placeholder="Your Name or Company" required />
                  </div>
                  <div>
                    <Label htmlFor="senderBank">Sender Bank</Label>
                    <Input id="senderBank" name="senderBank" placeholder="Your Bank Name" required />
                  </div>
                  <div>
                    <Label htmlFor="transferRef">Transfer Reference</Label>
                    <Input id="transferRef" name="transferRef" placeholder="Reference used in transfer" required />
                  </div>
                  <div>
                    <Label htmlFor="paymentProof">Upload Payment Proof</Label>
                    <Input id="paymentProof" name="paymentProof" type="file" accept="image/*,application/pdf" required />
                  </div>
                  <Button type="submit" className="w-full mt-2">Submit Transfer Details</Button>
                </form>
                <div className="text-xs text-gray-400 mt-3 text-center">Your plan will be activated once payment is confirmed.</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

export default PaymentForm;
