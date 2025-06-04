
// src/components/dashboard/airdrop-form.tsx
"use client";

import type { Airdrop, AirdropTask } from '@/types/airdrop';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CalendarIcon, PlusCircle, Trash2, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale'; // Indonesian locale for date formatting
import { useEffect, useState } from 'react';

const currentDate = new Date();
currentDate.setHours(0,0,0,0); // Set to start of day for comparison

// Schema definition (all fields optional as per request)
const airdropSchema = z.object({
  name: z.string().optional(),
  startDate: z.date().optional(),
  deadline: z.date().optional(),
  description: z.string().optional(),
  tasks: z.array(z.object({
    id: z.string().optional(), // Keep id if task already exists
    text: z.string().min(1, "Task description cannot be empty"),
    completed: z.boolean().default(false),
  })).optional(),
}).refine(data => {
  // At least one field must be filled
  return Object.values(data).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== '';
  });
}, {
  message: "At least one field must be filled to save.",
  // This path is not standard for react-hook-form to display.
  // We will use formState.isDirty or check values manually for button disable state.
});


type AirdropFormData = z.infer<typeof airdropSchema>;

interface AirdropFormProps {
  onSubmit: (data: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>) => void;
  initialData?: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>;
  onClose: () => void;
  isSaving: boolean;
}

const InputWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("input-gradient-glow-wrapper", className)}>{children}</div>
);

const AirdropForm = ({ onSubmit, initialData, onClose, isSaving }: AirdropFormProps) => {
  const { register, handleSubmit, control, formState: { errors, isValid, dirtyFields, touchedFields }, watch, reset } = useForm<AirdropFormData>({
    resolver: zodResolver(airdropSchema),
    defaultValues: {
      name: initialData?.name || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : undefined,
      deadline: initialData?.deadline ? new Date(initialData.deadline) : undefined,
      description: initialData?.description || '',
      tasks: initialData?.tasks || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tasks",
  });

  const [taskInput, setTaskInput] = useState('');

  // Track if any field has a value for enabling save button
  const watchedValues = watch();
  const isAnyFieldFilled = Object.values(watchedValues).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return value !== undefined;
  });

  useEffect(() => {
    if (initialData) {
        reset({
            name: initialData.name || '',
            startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
            deadline: initialData.deadline ? new Date(initialData.deadline) : undefined,
            description: initialData.description || '',
            tasks: initialData.tasks || [],
        });
    }
  }, [initialData, reset]);


  const handleFormSubmit = (data: AirdropFormData) => {
    const submissionData = {
        name: data.name || `Unnamed Airdrop ${new Date().toLocaleTimeString()}`, // Default name if empty
        startDate: data.startDate?.getTime(),
        deadline: data.deadline?.getTime(),
        description: data.description,
        tasks: data.tasks || [],
    };
    onSubmit(submissionData);
  };

  const handleAddTask = () => {
    if (taskInput.trim() !== '') {
      append({ text: taskInput.trim(), completed: false, id: crypto.randomUUID() });
      setTaskInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name" className="mb-1 block text-sm font-medium">Nama Airdrop</Label>
        <InputWrapper>
          <Input id="name" {...register('name')} placeholder="Contoh: Token XYZ Launch Airdrop" />
        </InputWrapper>
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="startDate" className="mb-1 block text-sm font-medium">Tanggal Mulai</Label>
          <InputWrapper>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost" // Use ghost and style manually to look like an input
                      className={cn(
                        "h-10 w-full justify-start truncate rounded-md border-none bg-transparent px-3 py-2 text-left text-sm font-normal ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
                        !field.value && "text-muted-foreground",
                        field.value && "text-foreground" // Ensure text color is foreground when a date is selected
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="bg-popover" // Ensure calendar popover matches dark theme
                       classNames={{
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                        day_today: "bg-accent text-accent-foreground",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </InputWrapper>
        </div>
        <div>
          <Label htmlFor="deadline" className="mb-1 block text-sm font-medium">Deadline / Tanggal Selesai</Label>
          <InputWrapper>
            <Controller
              name="deadline"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                     <Button
                        variant="ghost" // Use ghost and style manually
                        className={cn(
                          "h-10 w-full justify-start truncate rounded-md border-none bg-transparent px-3 py-2 text-left text-sm font-normal ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
                          !field.value && "text-muted-foreground",
                          field.value && "text-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        watch('startDate') ? date < watch('startDate')! : false
                      }
                      initialFocus
                      className="bg-popover"
                      classNames={{
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                        day_today: "bg-accent text-accent-foreground",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </InputWrapper>
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="mb-1 block text-sm font-medium">Deskripsi</Label>
        <InputWrapper>
          <Textarea id="description" {...register('description')} placeholder="Detail singkat mengenai airdrop, syarat, link, dll." rows={3} />
        </InputWrapper>
      </div>

      <div>
        <Label className="mb-1 block text-sm font-medium">Checklist Tugas</Label>
        <div className="space-y-2">
          {fields.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-md border border-input bg-background/50">
              <Controller
                name={`tasks.${index}.completed`}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id={`task-${index}-completed`}
                  />
                )}
              />
              <Controller
                  name={`tasks.${index}.text`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      className="flex-grow h-8 border-0 focus-visible:ring-0 bg-transparent"
                      placeholder="Deskripsi tugas"
                    />
                  )}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Hapus tugas">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <InputWrapper className="flex-grow">
            <Input 
              value={taskInput} 
              onChange={(e) => setTaskInput(e.target.value)} 
              placeholder="Tambahkan tugas baru..."
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(); }}}
            />
          </InputWrapper>
          <Button type="button" variant="outline" onClick={handleAddTask} className="shrink-0">
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Batal
        </Button>
        <Button type="submit" className="btn-gradient" disabled={!isAnyFieldFilled || isSaving}>
          {isSaving ? <div className="gradient-spinner w-5 h-5 after:w-3 after:h-3 mr-2"></div> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Menyimpan...' : 'Simpan Airdrop'}
        </Button>
      </div>
    </form>
  );
};

export default AirdropForm;
