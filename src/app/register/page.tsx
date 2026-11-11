'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Store,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BUSINESS_TYPES,
  validateIndianPhone,
  cleanIndianPhone,
  validateEmail,
  validateGSTIN,
} from '@/lib/registrationValidators';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'
];

export default function StoreRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Business, 2: Address, 3: Review & Submit, 4: Success
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [ownerName, setOwnerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [additionalPhones, setAdditionalPhones] = useState<string[]>([]);
  const [gstNumber, setGstNumber] = useState('');
  const [businessType, setBusinessType] = useState('Retailer');
  const [businessDescription, setBusinessDescription] = useState('');

  // Address Fields
  const [buildingNumber, setBuildingNumber] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pinCode, setPinCode] = useState('');
  const [country] = useState('India');

  // Consent
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Success result
  const [submissionResult, setSubmissionResult] = useState<{
    applicationId: string;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Dynamic additional phone helpers
  const addPhoneField = () => {
    if (additionalPhones.length < 5) {
      setAdditionalPhones([...additionalPhones, '']);
    }
  };

  const removePhoneField = (index: number) => {
    setAdditionalPhones(additionalPhones.filter((_, i) => i !== index));
  };

  const updatePhoneField = (index: number, val: string) => {
    const updated = [...additionalPhones];
    updated[index] = val;
    setAdditionalPhones(updated);
  };

  // Step 1 validation
  const validateStep1 = () => {
    setFormError(null);
    if (!ownerName.trim() || ownerName.trim().length < 2) {
      setFormError('Please enter owner / contact person full name (min 2 characters)');
      return false;
    }
    if (!storeName.trim() || storeName.trim().length < 2) {
      setFormError('Please enter store or registered business name (min 2 characters)');
      return false;
    }
    if (!email.trim() || !validateEmail(email)) {
      setFormError('Please enter a valid business email address');
      return false;
    }
    if (!primaryPhone.trim() || !validateIndianPhone(primaryPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number for primary contact');
      return false;
    }
    for (let i = 0; i < additionalPhones.length; i++) {
      const p = additionalPhones[i];
      if (p.trim() && !validateIndianPhone(p)) {
        setFormError(`Additional phone number #${i + 1} ("${p}") is invalid. Enter a 10-digit Indian number.`);
        return false;
      }
    }
    if (gstNumber.trim() && !validateGSTIN(gstNumber)) {
      setFormError('Invalid GSTIN format. Example: 22AAAAA0000A1Z5');
      return false;
    }
    return true;
  };

  // Step 2 validation
  const validateStep2 = () => {
    setFormError(null);
    if (!buildingNumber.trim()) {
      setFormError('Flat / Shop / Building number is required');
      return false;
    }
    if (!streetArea.trim()) {
      setFormError('Street / Area is required');
      return false;
    }
    if (!city.trim()) {
      setFormError('City is required');
      return false;
    }
    if (!state.trim()) {
      setFormError('State is required');
      return false;
    }
    if (!pinCode.trim() || !/^\d{6}$/.test(pinCode.trim())) {
      setFormError('Please enter a valid 6-digit Indian PIN code');
      return false;
    }
    return true;
  };

  const handleNextToAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleNextToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) setStep(3);
  };

  const handleFinalSubmit = async () => {
    setFormError(null);
    if (!termsAccepted) {
      setFormError('You must agree to the Terms & Conditions and Privacy Policy to submit your registration');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          storeName: storeName.trim(),
          email: email.trim(),
          primaryPhone: cleanIndianPhone(primaryPhone),
          additionalPhones: additionalPhones.filter(Boolean).map(cleanIndianPhone),
          gstNumber: gstNumber.trim() ? gstNumber.trim().toUpperCase() : undefined,
          businessType,
          businessDescription: businessDescription.trim() || undefined,
          buildingNumber: buildingNumber.trim(),
          streetArea: streetArea.trim(),
          city: city.trim(),
          state: state.trim(),
          pinCode: pinCode.trim(),
          country,
          termsAccepted,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration');
      }

      setSubmissionResult({
        applicationId: data.applicationId,
        message: data.message,
      });
      setStep(4);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred during submission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAppId = () => {
    if (!submissionResult?.applicationId) return;
    navigator.clipboard.writeText(submissionResult.applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-zinc-900">OmniStore</span>
              <span className="text-xs text-zinc-400 font-normal ml-1.5 hidden sm:inline">| Merchant Onboarding</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/register/track"
              className="text-xs text-zinc-600 hover:text-zinc-900 font-medium transition-colors"
            >
              Track Application
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs">
                Console Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {step < 4 && (
          <div className="mb-8 text-center sm:text-left">
            <Badge variant="outline" className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
              Business Registration
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              Register Your Store on OmniStore
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xl">
              Submit your verified business information. Once scrutinized and approved by our administration, your merchant console credentials will be issued.
            </p>

            {/* Stepper progress */}
            <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-6">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 1 ? 'text-zinc-900' : 'text-zinc-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'}`}>1</span>
                <span>Business Details</span>
              </div>
              <span className="w-6 sm:w-10 h-0.5 bg-zinc-200" />
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 2 ? 'text-zinc-900' : 'text-zinc-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'}`}>2</span>
                <span>Address</span>
              </div>
              <span className="w-6 sm:w-10 h-0.5 bg-zinc-200" />
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 3 ? 'text-zinc-900' : 'text-zinc-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'}`}>3</span>
                <span>Confirmation</span>
              </div>
            </div>
          </div>
        )}

        {formError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs mb-6 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{formError}</div>
          </div>
        )}

        {/* STEP 1: Business Details */}
        {step === 1 && (
          <Card className="border-zinc-200/90 shadow-sm">
            <CardHeader className="pb-4 border-b border-zinc-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-500" />
                Store & Proprietor Information
              </CardTitle>
              <CardDescription className="text-xs">
                Provide your legal contact and business profile details.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleNextToAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                      Owner / Contact Person Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Ramesh Sharma"
                        className="text-xs pl-8"
                      />
                      <User className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                      Store / Business Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="e.g. Sharma Electronics & Mobiles"
                        className="text-xs pl-8"
                      />
                      <Store className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                      Business Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contact@yourbusiness.com"
                        className="text-xs pl-8"
                      />
                      <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[10px] text-zinc-400">Credentials will be sent to this email upon approval.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                      Primary Phone Number (10 digits) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-zinc-500 text-xs font-medium">
                        <span>+91</span>
                      </div>
                      <Input
                        type="tel"
                        required
                        maxLength={10}
                        value={primaryPhone}
                        onChange={(e) => setPrimaryPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="text-xs pl-12"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400">Must be a valid 10-digit Indian mobile number.</p>
                  </div>
                </div>

                {/* Additional Phone Numbers (Dynamic Add/Remove) */}
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700">
                      Additional Phone Numbers <span className="text-zinc-400 font-normal">(Optional)</span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPhoneField}
                      disabled={additionalPhones.length >= 5}
                      className="h-7 text-[11px] px-2.5"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Another Number
                    </Button>
                  </div>

                  {additionalPhones.map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-medium">
                          +91
                        </div>
                        <Input
                          type="tel"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => updatePhoneField(idx, e.target.value.replace(/\D/g, ''))}
                          placeholder="Alternate phone number"
                          className="text-xs pl-12"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePhoneField(idx)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Remove number"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                      <span>GST Number</span>
                      <span className="text-[11px] text-zinc-400 font-normal">Optional</span>
                    </label>
                    <Input
                      type="text"
                      maxLength={15}
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      className="text-xs uppercase font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                      Business Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    >
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                    <span>Business Description</span>
                    <span className="text-[11px] text-zinc-400 font-normal">Optional</span>
                  </label>
                  <textarea
                    rows={3}
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Brief description of products, catalog categories, or operational scale..."
                    className="flex w-full rounded-md border border-zinc-200 bg-white p-2.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="text-xs font-medium">
                    Continue to Address <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Address Details */}
        {step === 2 && (
          <Card className="border-zinc-200/90 shadow-sm">
            <CardHeader className="pb-4 border-b border-zinc-100">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-500" />
                Complete Business Address
              </CardTitle>
              <CardDescription className="text-xs">
                Provide your registered physical store / warehouse location.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleNextToReview} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                      Flat / Shop / Building Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      value={buildingNumber}
                      onChange={(e) => setBuildingNumber(e.target.value)}
                      placeholder="e.g. Shop No. 12, Crystal Plaza"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                      Street / Area / Landmark <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      value={streetArea}
                      onChange={(e) => setStreetArea(e.target.value)}
                      placeholder="e.g. MG Road, Near City Mall"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                      PIN Code (6 digits) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="400001"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Country</label>
                  <Input type="text" disabled value={country} className="text-xs bg-zinc-50" />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                  </Button>
                  <Button type="submit" className="text-xs font-medium">
                    Review Application <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Review & Final Confirmation */}
        {step === 3 && (
          <Card className="border-zinc-200/90 shadow-sm">
            <CardHeader className="pb-4 border-b border-zinc-100">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Review Application Details
              </CardTitle>
              <CardDescription className="text-xs">
                Please verify all entered details before submitting for administrative scrutiny.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Summary table */}
              <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-zinc-100">
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Owner / Proprietor:</span>
                    <span className="font-semibold text-zinc-900">{ownerName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Store Name:</span>
                    <span className="font-semibold text-zinc-900">{storeName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Business Email:</span>
                    <span className="font-semibold text-zinc-900">{email}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Primary Phone:</span>
                    <span className="font-semibold text-zinc-900">+91 {primaryPhone}</span>
                  </div>
                  {additionalPhones.filter(Boolean).length > 0 && (
                    <div className="sm:col-span-2">
                      <span className="text-zinc-400 block text-[11px]">Additional Phones:</span>
                      <span className="font-medium text-zinc-700">
                        {additionalPhones.filter(Boolean).map((p) => `+91 ${p}`).join(', ')}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Business Type:</span>
                    <Badge variant="secondary" className="mt-0.5 text-[10px]">
                      {businessType}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">GSTIN Number:</span>
                    <span className="font-mono text-zinc-900">{gstNumber ? gstNumber.toUpperCase() : 'Not Provided'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 block text-[11px] mb-1">Registered Business Address:</span>
                  <p className="text-zinc-700 leading-relaxed bg-zinc-50 p-2.5 rounded border border-zinc-200/80 font-medium">
                    {buildingNumber}, {streetArea}, {city}, {state} - {pinCode}, {country}
                  </p>
                </div>

                {businessDescription && (
                  <div>
                    <span className="text-zinc-400 block text-[11px] mb-1">Description:</span>
                    <p className="text-zinc-600 italic bg-zinc-50 p-2.5 rounded border border-zinc-200/80">
                      {businessDescription}
                    </p>
                  </div>
                )}
              </div>

              {/* Consent Checkbox */}
              <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-zinc-700">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950"
                  />
                  <span>
                    I confirm that the provided store information and business credentials are authentic and accurate. I agree to the platform{' '}
                    <span className="underline font-medium text-zinc-900">Terms & Conditions</span> and{' '}
                    <span className="underline font-medium text-zinc-900">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Address
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting || !termsAccepted}
                  className="text-xs font-semibold px-6"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Submitting Registration...
                    </>
                  ) : (
                    <>
                      Submit Application <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Success Message */}
        {step === 4 && submissionResult && (
          <Card className="border-emerald-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-emerald-500 h-2 w-full" />
            <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="text-xl font-bold tracking-tight text-zinc-950">
                  Store Registration Submitted!
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  {submissionResult.message}
                </p>
              </div>

              {/* Application ID Card */}
              <div className="max-w-md mx-auto p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Your Unique Application ID</span>
                  <Badge variant="outline" className="bg-white text-[10px] uppercase font-semibold text-amber-600 border-amber-200">
                    Status: Pending Review
                  </Badge>
                </div>
                <div className="flex items-center justify-between bg-white border border-zinc-300 rounded-lg p-2.5">
                  <span className="font-mono text-base font-bold text-zinc-900 tracking-wider">
                    {submissionResult.applicationId}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyAppId}
                    className="h-7 text-xs px-2 gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Save this Application ID. You can use it alongside your registered email (<span className="font-medium text-zinc-700">{email}</span>) or phone to monitor review progress.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href={`/register/track?appId=${encodeURIComponent(submissionResult.applicationId)}&id=${encodeURIComponent(email)}`}
                  className="w-full sm:w-auto"
                >
                  <Button className="w-full sm:w-auto text-xs font-semibold">
                    Track Application Status <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto text-xs">
                    Return to Homepage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-400">
        OmniStore Commercial E-Commerce Platform · Merchant Governance & Store Onboarding
      </footer>
    </div>
  );
}

