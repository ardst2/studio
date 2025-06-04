
"use client";

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User } from '@/types/user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, X, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  displayName: z.string().min(1, "Nama tampilan tidak boleh kosong.").max(50, "Nama tampilan maksimal 50 karakter."),
  // photoURL is no longer part of the form schema directly, it's handled by file upload
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: { displayName: string; photoFile?: File }) => Promise<void>;
  isSaving: boolean;
}

const InputWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("input-gradient-glow-wrapper", className)}>{children}</div>
);

const EditProfileModal = ({ isOpen, onClose, user, onSave, isSaving }: EditProfileModalProps) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    }
  });
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = watch('displayName');

  useEffect(() => {
    if (isOpen) {
      reset({ displayName: user?.displayName || '' });
      setImagePreview(user?.photoURL || null);
      setSelectedFile(null);
    }
  }, [user, isOpen, reset]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "File Terlalu Besar",
          description: "Ukuran file maksimal adalah 5MB.",
        });
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Format File Salah",
          description: "Hanya file gambar yang diperbolehkan.",
        });
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // If no file is selected (e.g., user cancels file dialog), revert to original or clear preview
      // This part might need adjustment based on desired behavior for "clearing" a selection
      // For now, let's assume if they cancel, the preview might stay as is or revert to original user photo
       setSelectedFile(null); // Clear selected file if dialog is cancelled
       setImagePreview(user?.photoURL || null); // Revert to original if no new file
    }
  };

  const handleFormSubmit = async (data: ProfileFormData) => {
    await onSave({ displayName: data.displayName, photoFile: selectedFile });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg shadow-2xl border-border/60 p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="font-headline text-2xl text-foreground flex items-center">
            <Camera className="w-6 h-6 mr-2 text-gradient-theme" /> Edit Profil
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Perbarui nama tampilan dan foto profil Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <div
              className="relative group cursor-pointer"
              onClick={triggerFileInput}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileInput();}}
              role="button"
              tabIndex={0}
              aria-label="Ubah foto profil"
            >
              <Avatar className="h-24 w-24 border-4 border-primary/30 group-hover:opacity-75 transition-opacity">
                <AvatarImage src={imagePreview || undefined} alt={displayName || 'User'} />
                <AvatarFallback className="text-3xl font-bold bg-muted text-muted-foreground">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <UploadCloud className="h-8 w-8 text-white" />
              </div>
            </div>
            <Button type="button" variant="link" onClick={triggerFileInput} className="text-sm text-primary">
              Pilih Foto (Max 5MB)
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="photoFile"
            />
          </div>

          <div>
            <Label htmlFor="displayName" className="mb-1 block text-sm font-medium text-foreground">Nama Tampilan</Label>
            <InputWrapper>
              <Input
                id="displayName"
                {...register('displayName')}
                placeholder="Nama Anda"
                className={errors.displayName ? 'border-destructive' : ''}
              />
            </InputWrapper>
            {errors.displayName && <p className="mt-1 text-xs text-destructive">{errors.displayName.message}</p>}
          </div>
          
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving} onClick={onClose}>
                <X className="mr-2 h-4 w-4" /> Batal
              </Button>
            </DialogClose>
            <Button type="submit" className="btn-gradient" disabled={isSaving}>
              {isSaving ? (
                <div className="gradient-spinner w-5 h-5 after:w-3 after:h-3 mr-2"></div>
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
