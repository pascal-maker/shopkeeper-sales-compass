
/**
 * AddCustomerForm
 *
 * Collects customer details (name, phone, optional location and notes),
 * performs client-side validation and basic XSS sanitization, and emits
 * a clean payload via onSubmit. Designed to be used for both add and edit flows.
 *
 * Improvement suggestions:
 * - Consider using react-hook-form + zod for form state, validation, and better a11y.
 * - Phone validation could use libphonenumber-js for locale-aware parsing/formatting.
 * - Provide aria attributes (aria-invalid, aria-describedby) for screen readers.
 * - Disable the submit button when invalid or during a pending async submit.
 * - Debounce or adjust sanitization strategy to avoid surprising keystroke changes; sanitize on submit and escape on render instead.
 * - Externalize all user-facing strings for i18n.
 */
import { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Customer } from "@/types/customer";
import { 
  validatePhoneNumber, 
  validateName, 
  validateLocation, 
  validateNotes,
  sanitizeInput,
  ValidationErrors 
} from "@/utils/inputValidation";

/** Props contract for AddCustomerForm */
interface AddCustomerFormProps {
  customer?: Customer;
  onSubmit: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const AddCustomerForm = ({ customer, onSubmit, onCancel, isEditing = false }: AddCustomerFormProps) => {
  // Local, minimal form state. For larger forms, prefer react-hook-form to reduce re-renders
  // and to centralize validation and error reporting.
  const [formData, setFormData] = useState({
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    location: customer?.location ?? '',
    notes: customer?.notes ?? ''
  });

  // Field-level error messages keyed by input name
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate current formData and populate errors map.
   * Returns true if valid; false otherwise.
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate name (required + format)
    if (!formData.name.trim()) {
      newErrors.name = ValidationErrors.REQUIRED_FIELD;
    } else if (!validateName(formData.name)) {
      newErrors.name = ValidationErrors.NAME_INVALID;
    }

    // Validate phone (required + basic pattern)
    // Improvement: adopt libphonenumber-js for robust, locale-aware validation.
    if (!formData.phone.trim()) {
      newErrors.phone = ValidationErrors.REQUIRED_FIELD;
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = ValidationErrors.PHONE_INVALID;
    }

    // Validate optional fields (length caps)
    if (formData.location && !validateLocation(formData.location)) {
      newErrors.location = ValidationErrors.LOCATION_TOO_LONG;
    }

    if (formData.notes && !validateNotes(formData.notes)) {
      newErrors.notes = ValidationErrors.NOTES_TOO_LONG;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission: gate on validation, then emit sanitized/trimmed payload.
   * Consider disabling the submit button while processing to prevent double submits.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim() ?? undefined,
        notes: formData.notes.trim() ?? undefined
      });
    }
  };

  /**
   * Update field state. We sanitize on every keystroke to reduce XSS risk.
   * Improvement: sanitize on submit and escape on render to avoid altering user input as they type.
   */
  const handleInputChange = (field: string, value: string) => {
    // Sanitize input to prevent XSS
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                {/* Improvement: add aria-invalid/aria-describedby when errors.name is present */}
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter customer's full name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                {/* Improvement: use inputMode="tel" and pattern or a phone input library */}
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="0712345678"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* Location Field */}
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Westlands, Nairobi"
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location}</p>
                )}
              </div>

              {/* Notes Field */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                {/* Improvement: consider a character counter for notes length */}
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="e.g., Regular customer, prefers cash payments..."
                  rows={3}
                  className={errors.notes ? 'border-red-500' : ''}
                />
                {errors.notes && (
                  <p className="text-sm text-red-500">{errors.notes}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                {/* Improvement: disable when invalid or during pending save */}
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update' : 'Save'} Customer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
