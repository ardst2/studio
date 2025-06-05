
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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { PlusCircle, Trash2, Save, LinkIcon, InfoIcon, TagIcon, UsersIcon, FileTextIcon, ListChecksIcon, HashIcon, Share2Icon, GiftIcon, HelpCircleIcon, Edit3Icon, UserCheck, BarChart2, Briefcase, Globe, MessageSquare, Asterisk, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns'; // Import parseISO

// Schema definition including new fields
const airdropSchema = z.object({
  name: z.string().optional(),
  startDate: z.date().optional().nullable(),
  deadline: z.date().optional().nullable(),
  blockchain: z.string().optional(),

  registrationDate: z.date().optional().nullable(),
  participationRequirements: z.string().optional(),
  airdropLink: z.string().url({ message: "Link airdrop tidak valid" }).or(z.literal('')).optional(),
  informationSource: z.string().optional(),

  userDefinedStatus: z.string().optional(),
  description: z.string().optional(), 
  notes: z.string().optional(), 
  walletAddress: z.string().optional(),

  tokenAmount: z.number().min(0, "Jumlah token tidak boleh negatif").optional(),
  claimDate: z.date().optional().nullable(),
  
  airdropType: z.string().optional(),
  referralCode: z.string().optional(),

  tasks: z.array(z.object({
    id: z.string().optional(),
    text: z.string().min(1, "Deskripsi tugas tidak boleh kosong"),
    completed: z.boolean().default(false),
  })).optional(),
}).refine(data => {
  if (data.startDate && data.deadline && data.startDate > data.deadline) {
    return false;
  }
  return Object.values(data).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return true; 
    if (value instanceof Date) return true;
    return value !== undefined && value !== null; // Check for null as well
  });
}, {
  message: "Setidaknya satu bidang harus diisi. Pastikan Tanggal Mulai tidak setelah Tanggal Berakhir.",
  path: ['deadline'], 
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

const SectionTitle: React.FC<{ icon?: React.ElementType; title: string; className?: string }> = ({ icon: Icon, title, className }) => (
  <h3 className={cn("text-md font-semibold text-foreground mb-3 flex items-center mt-4 border-b border-border/30 pb-2", className)}>
    {Icon && <Icon className="w-4 h-4 mr-2 text-primary" />}
    {title}
  </h3>
);


const AirdropForm = ({ onSubmit, initialData, onClose, isSaving }: AirdropFormProps) => {
  const { register, handleSubmit, control, formState: { errors, isValid }, watch, reset } = useForm<AirdropFormData>({
    resolver: zodResolver(airdropSchema),
    defaultValues: {
      name: initialData?.name || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : undefined,
      deadline: initialData?.deadline ? new Date(initialData.deadline) : undefined,
      description: initialData?.description || '',
      tasks: initialData?.tasks || [],
      blockchain: initialData?.blockchain || '',
      registrationDate: initialData?.registrationDate ? new Date(initialData.registrationDate) : undefined,
      participationRequirements: initialData?.participationRequirements || '',
      airdropLink: initialData?.airdropLink || '',
      userDefinedStatus: initialData?.userDefinedStatus || '',
      notes: initialData?.notes || '',
      walletAddress: initialData?.walletAddress || '',
      tokenAmount: initialData?.tokenAmount || undefined,
      claimDate: initialData?.claimDate ? new Date(initialData.claimDate) : undefined,
      airdropType: initialData?.airdropType || '',
      referralCode: initialData?.referralCode || '',
      informationSource: initialData?.informationSource || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tasks",
  });

  const [taskInput, setTaskInput] = useState('');
  const watchedValues = watch();
  const isAnyFieldFilled = Object.values(watchedValues).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number' && !isNaN(value)) return true; 
    if (value instanceof Date) return true;
    return value !== undefined && value !== null;
  });
  
  useEffect(() => {
    const newDefaultValues = {
      name: initialData?.name || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : null,
      deadline: initialData?.deadline ? new Date(initialData.deadline) : null,
      description: initialData?.description || '',
      tasks: initialData?.tasks || [],
      blockchain: initialData?.blockchain || '',
      registrationDate: initialData?.registrationDate ? new Date(initialData.registrationDate) : null,
      participationRequirements: initialData?.participationRequirements || '',
      airdropLink: initialData?.airdropLink || '',
      userDefinedStatus: initialData?.userDefinedStatus || '',
      notes: initialData?.notes || '',
      walletAddress: initialData?.walletAddress || '',
      tokenAmount: initialData?.tokenAmount === null || initialData?.tokenAmount === undefined || isNaN(initialData.tokenAmount) ? undefined : initialData.tokenAmount,
      claimDate: initialData?.claimDate ? new Date(initialData.claimDate) : null,
      airdropType: initialData?.airdropType || '',
      referralCode: initialData?.referralCode || '',
      informationSource: initialData?.informationSource || '',
    };
    reset(newDefaultValues);
  }, [initialData, reset]);


  const handleFormSubmit = (data: AirdropFormData) => {
    const submissionData = {
        name: data.name || `Unnamed Airdrop ${new Date().toLocaleTimeString()}`,
        startDate: data.startDate?.getTime(),
        deadline: data.deadline?.getTime(),
        description: data.description,
        tasks: data.tasks || [],
        blockchain: data.blockchain,
        registrationDate: data.registrationDate?.getTime(),
        participationRequirements: data.participationRequirements,
        airdropLink: data.airdropLink,
        userDefinedStatus: data.userDefinedStatus,
        notes: data.notes, 
        walletAddress: data.walletAddress,
        tokenAmount: data.tokenAmount === undefined || isNaN(data.tokenAmount) ? undefined : Number(data.tokenAmount),
        claimDate: data.claimDate?.getTime(),
        airdropType: data.airdropType,
        referralCode: data.referralCode,
        informationSource: data.informationSource,
    };
    onSubmit(submissionData);
  };

  const handleAddTask = () => {
    if (taskInput.trim() !== '') {
      append({ text: taskInput.trim(), completed: false, id: crypto.randomUUID() });
      setTaskInput('');
    }
  };
  
  const NativeDatePickerField: React.FC<{ name: keyof AirdropFormData; label: string; error?: string }> = ({ name, label, error }) => (
    <div>
      <Label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <InputWrapper>
            <Input
              id={name}
              type="date"
              value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const dateValue = e.target.value;
                field.onChange(dateValue ? parseISO(dateValue) : undefined);
              }}
              className={cn(error ? 'border-destructive' : '', 'pr-8')} 
            />
          </InputWrapper>
        )}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-0">
      <SectionTitle icon={InfoIcon} title="Informasi Dasar" />
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="mb-1 block text-sm font-medium">Nama Airdrop</Label>
          <InputWrapper><Input id="name" {...register('name')} placeholder="Contoh: Token XYZ Launch" /></InputWrapper>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NativeDatePickerField name="startDate" label="Tanggal Mulai" error={errors.startDate?.message} />
          <NativeDatePickerField name="deadline" label="Tanggal Berakhir" error={errors.deadline?.message} />
        </div>
        <div>
          <Label htmlFor="blockchain" className="mb-1 block text-sm font-medium">Blockchain</Label>
          <InputWrapper><Input id="blockchain" {...register('blockchain')} placeholder="Contoh: Ethereum, Solana, BSC" /></InputWrapper>
        </div>
      </div>

      <SectionTitle icon={UserCheck} title="Partisipasi & Pendaftaran" />
      <div className="space-y-4">
        <NativeDatePickerField name="registrationDate" label="Tanggal Daftar" error={errors.registrationDate?.message} />
        <div>
          <Label htmlFor="participationRequirements" className="mb-1 block text-sm font-medium">Syarat Partisipasi</Label>
          <InputWrapper><Textarea id="participationRequirements" {...register('participationRequirements')} placeholder="Jelaskan syarat-syarat untuk ikut..." rows={3} /></InputWrapper>
        </div>
        <div>
          <Label htmlFor="airdropLink" className="mb-1 block text-sm font-medium">Link Airdrop</Label>
          <InputWrapper><Input id="airdropLink" type="url" {...register('airdropLink')} placeholder="https://contohairdrop.com" /></InputWrapper>
           {errors.airdropLink && <p className="mt-1 text-xs text-red-400">{errors.airdropLink.message}</p>}
        </div>
        <div>
          <Label htmlFor="informationSource" className="mb-1 block text-sm font-medium">Sumber Informasi</Label>
          <InputWrapper><Input id="informationSource" {...register('informationSource')} placeholder="Contoh: Twitter, Telegram, Blog" /></InputWrapper>
        </div>
      </div>

      <SectionTitle icon={FileTextIcon} title="Detail & Pelacakan" />
      <div className="space-y-4">
        <div>
          <Label htmlFor="userDefinedStatus" className="mb-1 block text-sm font-medium">Status (Kustom)</Label>
          <InputWrapper><Input id="userDefinedStatus" {...register('userDefinedStatus')} placeholder="Contoh: Applied, KYC Done, Waiting Distribution" /></InputWrapper>
        </div>
        <div>
          <Label htmlFor="description" className="mb-1 block text-sm font-medium">Deskripsi Umum</Label>
          <InputWrapper><Textarea id="description" {...register('description')} placeholder="Deskripsi umum tentang airdrop ini..." rows={3} /></InputWrapper>
        </div>
        <div>
          <Label htmlFor="notes" className="mb-1 block text-sm font-medium">Catatan Tambahan</Label>
          <InputWrapper><Textarea id="notes" {...register('notes')} placeholder="Catatan pribadi atau pengingat..." rows={2} /></InputWrapper>
        </div>
        <div>
          <Label htmlFor="walletAddress" className="mb-1 block text-sm font-medium">Alamat Wallet</Label>
          <InputWrapper><Input id="walletAddress" {...register('walletAddress')} placeholder="0x..." /></InputWrapper>
        </div>
      </div>

      <SectionTitle icon={GiftIcon} title="Token & Klaim" />
      <div className="space-y-4">
        <div>
          <Label htmlFor="tokenAmount" className="mb-1 block text-sm font-medium">Jumlah Token (Estimasi)</Label>
          <InputWrapper><Input id="tokenAmount" type="number" step="any" {...register('tokenAmount', {setValueAs: (v) => (v === "" || v === undefined || v === null || isNaN(Number(v)) ? undefined : Number(v))})} placeholder="Contoh: 100" /></InputWrapper>
          {errors.tokenAmount && <p className="mt-1 text-xs text-red-400">{errors.tokenAmount.message}</p>}
        </div>
        <NativeDatePickerField name="claimDate" label="Tanggal Klaim" error={errors.claimDate?.message} />
      </div>
      
      <SectionTitle icon={HelpCircleIcon} title="Informasi Lainnya" />
      <div className="space-y-4">
        <div>
          <Label htmlFor="airdropType" className="mb-1 block text-sm font-medium">Jenis Airdrop</Label>
          <InputWrapper><Input id="airdropType" {...register('airdropType')} placeholder="Contoh: Retroaktif, Testnet, Gleam" /></InputWrapper>
        </div>
        <div>
          <Label htmlFor="referralCode" className="mb-1 block text-sm font-medium">Kode Referral</Label>
          <InputWrapper><Input id="referralCode" {...register('referralCode')} placeholder="Jika ada" /></InputWrapper>
        </div>
      </div>

      <SectionTitle icon={ListChecksIcon} title="Checklist Tugas" />
      <div className="space-y-3">
        {fields.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2 p-2 rounded-md border border-input bg-background/50">
            <Controller name={`tasks.${index}.completed`} control={control} render={({ field }) => (<Checkbox checked={field.value} onCheckedChange={field.onChange} id={`task-${index}-completed`}/>)} />
            <Controller name={`tasks.${index}.text`} control={control} render={({ field }) => (<Input {...field} className="flex-grow h-8 border-0 focus-visible:ring-0 bg-transparent" placeholder="Deskripsi tugas"/>)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Hapus tugas"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        <div className="mt-2 flex items-center gap-2">
          <InputWrapper className="flex-grow"><Input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} placeholder="Tambahkan tugas baru..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(); }}}/></InputWrapper>
          <Button type="button" variant="outline" onClick={handleAddTask} className="shrink-0"><PlusCircle className="mr-2 h-4 w-4" /> Tambah</Button>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-8">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Batal</Button>
        <Button type="submit" className="btn-gradient" disabled={!isAnyFieldFilled || isSaving || !isValid}>
          {isSaving ? <div className="gradient-spinner w-5 h-5 after:w-3 after:h-3 mr-2"></div> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Menyimpan...' : 'Simpan Airdrop'}
        </Button>
      </div>
    </form>
  );
};

export default AirdropForm;

