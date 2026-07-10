// Form Framework - Reusable form components for all enterprise modules
import {
  useState,
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronsUpDown, Check, X, Search, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

// ============================================================
// Form Field Wrapper
// ============================================================
interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, hint, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ============================================================
// Text Input
// ============================================================
interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <FormField label={label} error={error} hint={hint} required={props.required}>
        <Input
          ref={ref}
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
          {...props}
        />
      </FormField>
    );
  },
);
FormInput.displayName = "FormInput";

// ============================================================
// Textarea
// ============================================================
interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <FormField label={label} error={error} hint={hint} required={props.required}>
        <Textarea
          ref={ref}
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
          {...props}
        />
      </FormField>
    );
  },
);
FormTextarea.displayName = "FormTextarea";

// ============================================================
// Select Input
// ============================================================
interface FormSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}

export function FormSelect({
  label,
  error,
  hint,
  required,
  placeholder = "Select...",
  value,
  onValueChange,
  options,
  disabled,
  className,
}: FormSelectProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

// ============================================================
// Date Picker
// ============================================================
interface FormDatePickerProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function FormDatePicker({
  label,
  error,
  hint,
  required,
  value,
  onChange,
  disabled,
  className,
}: FormDatePickerProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive",
              className,
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {value ? format(value, "MMM dd, yyyy") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
        </PopoverContent>
      </Popover>
    </FormField>
  );
}

// ============================================================
// Time Picker
// ============================================================
interface FormTimePickerProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FormTimePicker({
  label,
  error,
  hint,
  required,
  value,
  onChange,
  disabled,
  className,
}: FormTimePickerProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
      />
    </FormField>
  );
}

// ============================================================
// Radio Group
// ============================================================
interface FormRadioGroupProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  options: { value: string; label: string; description?: string }[];
  disabled?: boolean;
  className?: string;
}

export function FormRadioGroup({
  label,
  error,
  hint,
  required,
  value,
  onValueChange,
  options,
  disabled,
  className,
}: FormRadioGroupProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        className={className}
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-start gap-3">
            <RadioGroupItem value={opt.value} id={`radio-${opt.value}`} className="mt-0.5" />
            <div>
              <Label htmlFor={`radio-${opt.value}`} className="text-sm font-medium cursor-pointer">
                {opt.label}
              </Label>
              {opt.description && (
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              )}
            </div>
          </div>
        ))}
      </RadioGroup>
    </FormField>
  );
}

// ============================================================
// Checkbox Group
// ============================================================
interface FormCheckboxProps {
  label?: string;
  error?: string;
  hint?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  description?: string;
}

export function FormCheckbox({
  label,
  error,
  hint,
  checked,
  onCheckedChange,
  disabled,
  className,
  description,
}: FormCheckboxProps) {
  return (
    <FormField error={error} hint={hint}>
      <div className={cn("flex items-start gap-3", className)}>
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          id="checkbox-field"
          className="mt-0.5"
        />
        <div>
          {label && (
            <Label htmlFor="checkbox-field" className="text-sm font-medium cursor-pointer">
              {label}
            </Label>
          )}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
    </FormField>
  );
}

// ============================================================
// Search Select (Autocomplete)
// ============================================================
interface FormSearchSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: { value: string; label: string; subtitle?: string }[];
  disabled?: boolean;
  className?: string;
  loading?: boolean;
}

export function FormSearchSelect({
  label,
  error,
  hint,
  required,
  placeholder = "Search...",
  value,
  onValueChange,
  options,
  disabled,
  className,
  loading = false,
}: FormSearchSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.subtitle && opt.subtitle.toLowerCase().includes(search.toLowerCase())),
  );

  const selected = options.find((opt) => opt.value === value);

  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              error && "border-destructive",
              className,
            )}
          >
            {selected ? selected.label : placeholder}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[300px] p-2" align="start">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Type to search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No results found</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onValueChange?.(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    opt.value === value && "bg-primary/10 text-primary",
                  )}
                >
                  <div className="flex-1">
                    <span>{opt.label}</span>
                    {opt.subtitle && (
                      <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
                    )}
                  </div>
                  {opt.value === value && <Check className="size-4 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </FormField>
  );
}

// ============================================================
// Toggle Chip / Multi-Select
// ============================================================
interface FormChipSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  value?: string[];
  onChange?: (value: string[]) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}

export function FormChipSelect({
  label,
  error,
  hint,
  required,
  value = [],
  onChange,
  options,
  disabled,
  className,
}: FormChipSelectProps) {
  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange?.(value.filter((v) => v !== val));
    } else {
      onChange?.([...value, val]);
    }
  };

  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <div className={cn("flex flex-wrap gap-2", className)}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => toggle(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              value.includes(opt.value)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {opt.label}
            {value.includes(opt.value) && <X className="size-3" />}
          </button>
        ))}
      </div>
    </FormField>
  );
}

// ============================================================
// Section Divider
// ============================================================
export function FormSection({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-border pb-3 mb-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

// ============================================================
// Form Row (grid layout helper)
// ============================================================
export function FormRow({
  children,
  cols = 2,
  className,
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
  };
  return <div className={cn("grid gap-4", gridCols[cols], className)}>{children}</div>;
}

// ============================================================
// Form Actions (footer buttons)
// ============================================================
interface FormActionsProps {
  children?: React.ReactNode;
  onCancel?: () => void;
  onSave?: () => void;
  loading?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  className?: string;
}

export function FormActions({
  children,
  onCancel,
  onSave,
  loading,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  className,
}: FormActionsProps) {
  return (
    <div
      className={cn("flex items-center justify-end gap-3 border-t border-border pt-4", className)}
    >
      {children ?? (
        <>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {saveLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// Wizard Step Indicator
// ============================================================
interface WizardStep {
  id: string;
  label: string;
  description?: string;
}

interface WizardStepsProps {
  steps: WizardStep[];
  currentStep: string;
  className?: string;
}

export function WizardSteps({ steps, currentStep, className }: WizardStepsProps) {
  const currentIdx = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center">
        {steps.map((step, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isUpcoming = i > currentIdx;

          return (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "grid size-8 place-items-center rounded-full text-xs font-bold transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isUpcoming && "bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="size-4" /> : <span>{i + 1}</span>}
                </div>
                <span
                  className={cn(
                    "mt-1 text-[10px] font-medium text-center",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-[-1.5rem]",
                    i < currentIdx ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
