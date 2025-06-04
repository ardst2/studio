
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User } from '@/types/user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  displayName: z.string().min(1, "Nama tampilan tidak boleh kosong.").max(50, "Nama tampilan maksimal 50 karakter."),
  photoURL: z.string().url("URL foto tidak valid.").or(z.literal('')).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: { displayName: string; photoURL?: string }) => Promise<void>;
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
      photoURL: user?.photoURL || '',
    }
  });
  const { toast } = useToast();

  const displayName = watch('displayName');
  const photoURL_form = watch('photoURL'); // Watched value from the form

  useEffect(() => {
    if (isOpen && user) {
      reset({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      });
    } else if (isOpen && !user) {
      reset({
        displayName: '',
        photoURL: '',
      });
    }
  }, [user, isOpen, reset]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleFormSubmit = async (data: ProfileFormData) => {
    await onSave({ displayName: data.displayName, photoURL: data.photoURL });
  };

  // Determine the image source for the avatar preview
  const avatarImageSrc = photoURL_form || user?.photoURL || undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg shadow-2xl border-border/60 p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="font-headline text-2xl text-foreground flex items-center">
            <Camera className="w-6 h-6 mr-2 text-gradient-theme" /> Edit Profil
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Perbarui nama tampilan dan URL foto profil Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="h-24 w-24 border-4 border-primary/30">
              <AvatarImage src={avatarImageSrc} alt={displayName || 'User'} />
              <AvatarFallback className="text-3xl font-bold bg-muted text-muted-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
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

          <div>
            <Label htmlFor="photoURL" className="mb-1 block text-sm font-medium text-foreground">URL Foto Profil</Label>
            <InputWrapper>
              <Input
                id="photoURL"
                {...register('photoURL')}
                placeholder="https://example.com/foto.png"
                className={errors.photoURL ? 'border-destructive' : ''}
              />
            </InputWrapper>
            {errors.photoURL && <p className="mt-1 text-xs text-destructive">{errors.photoURL.message}</p>}
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
