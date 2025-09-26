
"use client";

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, File, X, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format, setYear } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
// Temporarily commented for server-only version
// import { storage } from '@/lib/firebase';
// import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Lists for dropdowns
const vehicleBrands = [
 'Toyota', 'Volkswagen', 'Ford', 'Mercedes-Benz', 'BMW', 'Audi', 'Opel', 'Renault', 'Fiat', 'Nissan',
 'Hyundai', 'Kia', 'Škoda', 'Citroën', 'Peugeot', 'Seat', 'Volvo', 'Mazda', 'Honda', 'Dacia'
];

const polishProvinces = [
 'Dolnośląskie', 'Kujawsko-Pomorskie', 'Lubelskie', 'Lubuskie', 'Łódzkie', 'Małopolskie',
 'Mazowieckie', 'Opolskie', 'Podkarpackie', 'Podlaskie', 'Pomorskie', 'Śląskie', 'Świętokrzyskie',
 'Warmińsko-Mazurskie', 'Wielkopolskie', 'Zachodniopomorskie'
];

const formSchema = z.object({
  fullName: z.string().min(1, 'Pole jest wymagane.'),
  email: z.string().min(1, 'Pole jest wymagane.').email('Nieprawidłowy adres email.'),
  phone: z.string().min(1, 'Pole jest wymagane.').regex(/^\+?[0-9\s-()]+$/, 'Nieprawidłowy format telefonu.'),
  files: z.custom<FileList>().refine(files => files?.length > 0, 'Wymagane jest przesłanie przynajmniej jednego pliku.'),
  privacyPolicy: z.boolean().refine(value => value === true, {
    message: "Musisz zaakceptować politykę prywatności.",
  }),
  // Campo honeypot para detectar bots
  honeypot: z.string().max(0, 'Detección de bot activada'),
  // Tiempo mínimo para evitar envíos automáticos
  submitTime: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

export default function UploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [submitStartTime] = useState(Date.now()); // Tiempo inicial del formulario
  const { toast } = useToast();

  const scrollToFirstError = () => {
    const errors = form.formState.errors;
    const fields = {
      1: ['fullName', 'email', 'phone'],
      2: ['files', 'privacyPolicy']
    };
    const sectionFields = fields[currentSection as keyof typeof fields];
    for (const field of sectionFields) {
      if (errors[field as keyof FormValues]) {
        const element = document.querySelector(`[name="${field}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      files: undefined,
      privacyPolicy: false,
      honeypot: '', // Campo escondido para bots
      submitTime: submitStartTime, // Tiempo de inicio del formulario
    },
  });

  const updateFileList = (newFiles: File[]) => {
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);

    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));
    form.setValue('files', dataTransfer.files, { shouldValidate: true });

    // Show immediate success feedback
    if (newFiles.length > 0) {
      setShowUploadSuccess(true);
      setTimeout(() => setShowUploadSuccess(false), 3000); // Hide after 3 seconds
      toast({
        title: "✅ Pliki przesłane!",
        description: `${newFiles.length} plik${newFiles.length === 1 ? ' został' : 'i zostały'} poprawnie przesłan${newFiles.length === 1 ? 'y' : 'e'}.`,
      });
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      updateFileList(Array.from(e.target.files));
    }
  };
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);
  
  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      updateFileList(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, [files, form]);
  
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    form.setValue('files', dataTransfer.files, { shouldValidate: true });
  };

  const nextSection = () => setCurrentSection(currentSection + 1);
  const prevSection = () => setCurrentSection(currentSection - 1);

  const handleNext = async () => {
    if (currentSection === 1) {
      // Solo validar campos de la sección 1
      const isValid = await form.trigger(["fullName", "email", "phone"]);
      if (isValid) {
        setCurrentSection(currentSection + 1);
      } else {
        scrollToFirstError();
      }
    } else if (currentSection === 2) {
      // Validación completa más anti-spam antes del envío
      const allData = form.getValues();
      const elapsedTime = Date.now() - submitStartTime;

      // Verificar tiempo mínimo (5 segundos) y honeypot
      if (allData.honeypot && allData.honeypot.length > 0) {
        toast({
          variant: "destructive",
          title: "Archivo no válido",
          description: "Se detectó actividad sospechosa. Inténtalo nuevamente.",
        });
        return;
      }

      if (elapsedTime < 5000) { // 5 segundos mínimo
        toast({
          variant: "destructive",
          title: "Demasiado rápido",
          description: "Por favor, tómate tiempo para completar el formulario correctamente.",
        });
        return;
      }

      // Validar campos de la sección 2
      const isValid = await form.trigger(["files", "privacyPolicy"]);
      if (isValid) {
        await onSubmit(allData);
      } else {
        scrollToFirstError();
        toast({
          variant: "destructive",
          title: "Błąd walidacji",
          description: "Proszę wypełnić wszystkie wymagane pola prawidłowo.",
        });
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
        setUploadProgress(30); // Mostrar progreso

        // Crear FormData para enviar archivos + datos
        const formDataToSend = new FormData();
        formDataToSend.append('fullName', data.fullName);
        formDataToSend.append('email', data.email);
        formDataToSend.append('phone', data.phone);

        // Agregar todos los archivos seleccionados
        if (data.files && data.files.length > 0) {
            Array.from(data.files).forEach((file: any, index: number) => {
                formDataToSend.append(`files[${index}]`, file);
            });
        }

        formDataToSend.append('fileCount', data.files ? data.files.length.toString() : '0');
        formDataToSend.append('timestamp', new Date().toISOString());

        setUploadProgress(70); // Archivos preparados

        // Enviar a la API local
        const response = await fetch('/api/send-quote', {
            method: 'POST',
            body: formDataToSend,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.ok) {
            throw new Error('Error enviando solicitud');
        }

        const result = await response.json();

        setUploadProgress(100); // Completar progreso

        setIsUploading(false);
        setIsSuccess(true);

        toast({
            title: "✅ ¡Solicitud enviada!",
            description: "Hemos recibido tus datos y te hemos enviado confirmación por email.",
        });

        setTimeout(() => {
            setIsSuccess(false);
            setFiles([]);
            form.reset();
        }, 4000);

    } catch (error) {
        setIsUploading(false);
        toast({
            variant: "destructive",
            title: "Błąd!",
            description: "Wystąpił błąd podczas wysyłania plików. Spróbuj ponownie.",
        });
        console.error("Error during upload process:", error);
    }
  };

  return (
    <section id="kontakt" className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">
                    Otrzymaj darmową wycenę
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Prześlij nam zdjęcia dokumentów, a my przygotujemy dokładne koszty w 48h.
                </p>
            </div>

            {isSuccess ? (
                <div className="text-center p-12 bg-green-100 dark:bg-green-900/50 rounded-lg border-2 border-green-200 dark:border-green-800">
                    <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold text-green-700 dark:text-green-300 mb-4">¡Enviado Correctamente!</h3>
                    <p className="text-lg text-green-600 dark:text-green-400 mb-4 font-medium">Tu formulario ha sido enviado correctamente</p>
                    <p className="text-muted-foreground text-base leading-relaxed mb-4">
                        En 48 horas te daremos una respuesta. <br />
                        Nos pondremos en contacto contigo con presupuesto detallado.
                    </p>
                    <div className="mt-6 pt-6 border-t border-green-200 dark:border-green-800">
                        <p className="text-sm text-muted-foreground italic">
                            Todos los archivos han sido subidos correctamente y enviados para procesamiento.
                        </p>
                    </div>
                </div>
            ) : (
                <Form {...form}>
                    <form className="space-y-8">
                        {/* Campo Honeypot - Oculto para humanos, visible para bots */}
                        <div className="absolute left-[-9999px] overflow-hidden h-0">
                            <FormField
                                control={form.control}
                                name="honeypot"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Leave this field empty</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Anti-spam field" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Section Indicator */}
                        <div className="flex justify-center mb-8">
                            <div className="flex space-x-4">
                                <div className={`w-8 h-8 rounded-full ${currentSection >= 1 ? 'bg-primary text-primary-foreground' : 'bg-gray-300 dark:bg-gray-700'} flex items-center justify-center text-sm font-semibold`}>1</div>
                                <div className={`w-8 h-8 rounded-full ${currentSection >= 2 ? 'bg-primary text-primary-foreground' : 'bg-gray-300 dark:bg-gray-700'} flex items-center justify-center text-sm font-semibold`}>2</div>
                            </div>
                        </div>

                        {/* Section 1: Dane osobowe */}
                        {currentSection === 1 && (
                            <>
                                <h3 className="text-xl font-semibold mb-4">Dane osobowe</h3>
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Imię i nazwisko</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Jan Kowalski" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="email@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefon</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+48 123 456 789" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Section 2: Dokumentacja */}
                        {currentSection === 2 && (
                            <>
                                <h3 className="text-xl font-semibold mb-4">Dokumentacja</h3>
                                <FormField
                                    control={form.control}
                                    name="files"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Dokumenty (karta techniczna, NIE/dowód)</FormLabel>
                                            <FormControl>
                                                <div
                                                    onDragEnter={handleDragIn}
                                                    onDragLeave={handleDragOut}
                                                    onDragOver={handleDrag}
                                                    onDrop={handleDrop}
                                                    className={`mt-2 flex justify-center items-center w-full h-48 sm:h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors touch-manipulation ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
                                                >
                                                    <label htmlFor="dropzone-file" className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                                                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                                        <p className="mb-2 text-sm text-muted-foreground">
                                                            <span className="font-semibold">Kliknij, aby wybrać</span> lub przeciągnij i upuść
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">Zdjęcia lub PDF</p>
                                                        <input id="dropzone-file" type="file" className="hidden" multiple onChange={onFileChange} accept="image/*,.pdf" />
                                                    </label>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {files.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 p-3 rounded-md">
                                            <CheckCircle className="w-5 h-5 shrink-0" />
                                            <span className="text-sm font-medium">{files.length} plik{files.length === 1 ? ' został' : 'i zostały'} poprawnie przesłan{files.length === 1 ? 'y' : 'e'}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium">Wybrane pliki:</h4>
                                            <ul className="space-y-2">
                                                {files.map((file, index) => (
                                                <li key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <File className="w-4 h-4 shrink-0" />
                                                        <span className="truncate">{file.name}</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeFile(index)} className="p-1 rounded-full hover:bg-destructive/20 text-destructive">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                <FormField
                                    control={form.control}
                                    name="privacyPolicy"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <div>
                                                    Akceptuję <Link href="/polityka-prywatnosci" className="text-primary underline hover:no-underline">politykę ochrony danych</Link> i zgadzam się na przetwarzanie moich danych osobowych na potrzeby rejestracji pojazdu.
                                                </div>
                                                <FormMessage />
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex flex-col sm:flex-row justify-between mt-8 gap-3 sm:gap-0">
                            {currentSection > 1 && (
                                <Button type="button" variant="outline" onClick={prevSection} className="order-1 sm:order-1">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Poprzedni krok
                                </Button>
                            )}
                            <div className="order-2 sm:hidden"></div>
                            <Button
                                type="button"
                                onClick={currentSection === 2 ? handleNext : nextSection}
                                disabled={isUploading}
                                className={`order-3 sm:order-3 ${currentSection === 1 ? 'w-full sm:w-auto' : 'ml-auto'}`}
                            >
                                {currentSection === 2 ? (
                                    <>
                                        {isUploading ? 'Wysyłanie...' : 'Wyślij i otrzymaj wycenę'}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                ) : (
                                    <>
                                        Następny krok
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>

                        {isUploading && <Progress value={uploadProgress} className="w-full" />}
                    </form>
                </Form>
            )}
        </div>
    </section>
  );
}

    