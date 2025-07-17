
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Shield, ShieldCheck, Plus, Pencil, Trash2 } from "lucide-react";
import PaymentForm from "./Payment";
import { toast } from "sonner";

const AdminPlan = () => {
  const [showAddPlanForm, setShowAddPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  
  // Mock data for plans - in a real app, this would come from Supabase
  const [plans, setPlans] = useState([
    {
      id: 1,
      name: "Basic",
      price: 9.99,
      features: ["10 vehicles", "Standard support", "Basic analytics"],
      isPopular: false,
    },
    {
      id: 2,
      name: "Professional",
      price: 29.99,
      features: ["50 vehicles", "Priority support", "Advanced analytics", "API access"],
      isPopular: true,
    },
    {
      id: 3,
      name: "Enterprise",
      price: 99.99,
      features: ["Unlimited vehicles", "24/7 support", "Custom analytics", "API access", "White labeling"],
      isPopular: false,
    },
  ]);
  
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: 0,
    features: "",
    isPopular: false,
  });
  
  const handleAddPlan = () => {
    if (!newPlan.name || newPlan.price <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const featuresArray = newPlan.features.split(',').map(f => f.trim());
    
    setPlans([
      ...plans,
      {
        id: plans.length + 1,
        name: newPlan.name,
        price: newPlan.price,
        features: featuresArray,
        isPopular: newPlan.isPopular,
      },
    ]);
    
    setNewPlan({
      name: "",
      price: 0,
      features: "",
      isPopular: false,
    });
    
    setShowAddPlanForm(false);
    toast.success("Plan added successfully");
  };
  
  const handleDeletePlan = (id: number) => {
    setPlans(plans.filter(plan => plan.id !== id));
    toast.success("Plan deleted successfully");
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Plan Management</h1>
          <p className="text-muted-foreground">Manage subscription plans for your customers</p>
        </div>

      </div>
      
      {selectedPlan ? (
        <div>
          <Button variant="ghost" className="mb-6" onClick={() => setSelectedPlan(null)}>
            ← Back to Plans
          </Button>
          <PaymentForm plan={selectedPlan} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-10">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border transition-shadow duration-200 bg-white hover:shadow-2xl ${plan.isPopular ? 'border-fleet-500 ring-2 ring-fleet-400 scale-105 z-10' : 'border-gray-200'} p-6 flex flex-col items-center`}
            >
              {plan.isPopular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-fleet-500 text-white px-4 py-1 rounded-full shadow-lg text-xs font-semibold tracking-wide z-20">
                  MOST POPULAR
                </span>
              )}
              <div className="flex flex-col items-center mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{plan.name}</h2>
                <div className="flex items-end mb-2">
                  <span className="text-4xl font-bold text-fleet-500">{plan.price} DT</span>
                  <span className="text-lg text-gray-500 ml-1 mb-1">/month</span>
                </div>
              </div>
              <ul className="w-full mb-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700">
                    <ShieldCheck className="h-5 w-5 text-fleet-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col w-full gap-2 mt-auto">
                <Button
                  className={`w-full py-2 rounded-lg font-bold text-lg transition-all duration-200 ${plan.isPopular ? 'bg-fleet-500 hover:bg-fleet-600 text-white' : 'bg-white border border-fleet-500 text-fleet-500 hover:bg-fleet-50'}`}
                  variant={plan.isPopular ? "default" : "outline"}
                  onClick={() => setSelectedPlan(plan)}
                >
                  Upgrade
                </Button>
                <Button className="w-full py-2 rounded-lg text-base" variant="outline">
                  View Subscribers
                </Button>
              </div>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 hover:opacity-100 transition-opacity duration-200 group-hover:opacity-100">
                <Button size="icon" variant="ghost" onClick={() => setEditingPlan(plan.id)}>
                  <Pencil className="h-4 w-4 text-gray-400 hover:text-fleet-500" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDeletePlan(plan.id)}>
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      

    </div>
  );
};

export default AdminPlan;
