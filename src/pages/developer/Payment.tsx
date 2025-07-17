
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, CreditCard } from "lucide-react";

const DeveloperPayment = () => {
  // Mock data - in a real app would come from Supabase based on the user's ID
  const paymentMethods = [
    {
      id: "pm_1",
      type: "credit_card",
      brand: "Visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 25,
      isDefault: true,
    }
  ];
  
  const invoices = [
    {
      id: "INV-1234",
      date: "2025-05-11",
      amount: 29.99,
      status: "paid",
      description: "Professional Plan - Monthly Subscription",
    },
    {
      id: "INV-1233",
      date: "2025-04-11",
      amount: 29.99,
      status: "paid",
      description: "Professional Plan - Monthly Subscription",
    },
    {
      id: "INV-1232",
      date: "2025-03-11",
      amount: 29.99,
      status: "paid",
      description: "Professional Plan - Monthly Subscription",
    },
    {
      id: "INV-1231",
      date: "2025-02-11",
      amount: 9.99,
      status: "paid",
      description: "Basic Plan - Monthly Subscription",
    },
  ];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payment Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>Manage your payment methods and billing details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Payment Methods</h3>
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">
                        {method.brand} •••• {method.last4}
                        {method.isDefault && (
                          <Badge variant="outline" className="ml-2">Default</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Expires {method.expiryMonth}/{method.expiryYear}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              ))}
              <Button variant="outline" className="mt-3 w-full">
                Add Payment Method
              </Button>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Billing Address</h3>
              <div className="p-3 border rounded-md">
                <p>TechFusion Labs</p>
                <p>123 Innovation Street</p>
                <p>San Francisco, CA 94103</p>
                <p>United States</p>
              </div>
              <Button variant="outline" className="mt-3">
                Update Billing Address
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan and billing cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Current Plan:</span>
                <span className="font-medium">Professional</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Price:</span>
                <span>$29.99/month</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Billing Cycle:</span>
                <span>Monthly</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Next Payment:</span>
                <span>June 11, 2025</span>
              </div>
              <div className="flex justify-between">
                <span>Auto Renewal:</span>
                <span>Enabled</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1">Change Plan</Button>
              <Button variant="outline" className="flex-1">Manage Billing</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View your past invoices and payments</CardDescription>
          </div>
          <Button variant="outline" className="flex items-center">
            <Receipt className="mr-2 h-4 w-4" />
            Download All
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Receipt className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperPayment;
