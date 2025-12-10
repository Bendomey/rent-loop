import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useUpdatePassword } from "~/api/auth";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "~/components/ui/alert-dialog";
import { FieldGroup } from "~/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";

interface Props {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
}


const ValidationSchema = z
  .object({
    old_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(5, "Password must be at least 5 characters"),
    confirm_password: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

type FormSchema = z.infer<typeof ValidationSchema>

export default function UpdatePasswordModal({ opened, setOpened }: Props) {
  const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

  const rhfMethods = useForm<FormSchema>({
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
    resolver: zodResolver(ValidationSchema),
  });

  const { handleSubmit, control } = rhfMethods;
  const { mutate, isPending } = useUpdatePassword();

  const onSubmit = (data: FormSchema) => {
    mutate(
      {
        old_password: data.old_password,
        new_password: data.new_password,
      },
      {
        onError: () => {
          toast.error("Failed to update password. Try again later.");
        },
        onSuccess: () => {
          toast.success("Password updated successfully");
          setOpened(false);
        },
      }
    );
  };

  return (
    <AlertDialog open={opened} onOpenChange={setOpened} >
      <AlertDialogContent className=" rounded-xl ">
        <AlertDialogHeader>
          <AlertDialogTitle>Update Password</AlertDialogTitle>
          <AlertDialogDescription>
            Use a strong and secure password for your account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...rhfMethods}>
          <form
            className="mt-3 md:mt-6"
          >
              <FieldGroup className="max-sm:gap-3">
                <FormField
                  name="old_password"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                        <Input  type={showOld ? "text" : "password"} {...field} />
                        <button
            type="button"
            onClick={() => setShowOld((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
            </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="new_password"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                         <div className="relative">
                        <Input
                        type={showNew ? "text" : "password"}
                          {...field}
                        />
                         <button
            type="button"
            onClick={() => setShowNew((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="confirm_password"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                        <Input  type={showConfirm ? "text" : "password"} {...field} />
                        <button
            type="button"
            onClick={() => setShowConfirm((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldGroup>

              </form>
            </Form>
            <AlertDialogFooter className="flex flex-row max-sm: justify-between">
              <AlertDialogCancel disabled={isPending} onClick={() => setOpened(false)}>
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={isPending}
                onClick={handleSubmit(onSubmit)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isPending ? <Spinner /> : null}
                Update Password
              </AlertDialogAction>
            </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
