import { useForm } from 'react-hook-form'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '~/components/ui/card'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '~/components/ui/form'
import { ImageUpload } from '~/components/ui/image-upload'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
    Select,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectContent,
} from '~/components/ui/select'

export function PropertyTenantApplicationIdentity() {

    const rhfMethods = useForm({
        // resolver: zodResolver(ValidationSchema),
        // defaultValues: {
        // 	marital_status: formData.marital_status || 'SINGLE',
        // 	gender: formData.gender || 'MALE',
        // },
    })
    const { control } = rhfMethods

    return (
        <Card className="shadow-none">
            <CardHeader>
                <CardTitle>Identity Verification</CardTitle>
                <CardDescription>
                    Review and update tenant's identification details and document images for verification.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
                <Form {...rhfMethods}>
                    <form>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <FormField
                                    name="nationality"
                                    control={control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Nationality <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="text" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div>
                                <FormField
                                    name="id_type"
                                    control={control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                ID Type <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Please select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                                                        <SelectItem value="PASSPORT">Passport</SelectItem>
                                                        <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                                                        <SelectItem value="STUDENT_ID">Student ID</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='col-span-2'>
                                <FormField
                                    name="id_number"
                                    control={control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                ID Number <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="text" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className='col-span-2 mt-2'>
                                <Label>ID Document Images</Label>
                            </div>
                            <div className="col-span-1">
                                <ImageUpload
                                    hero
                                    shape="square"
                                    hint="Optional"
                                    acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
                                    // error={rhfMethods.formState.errors?.profile_photo_url?.message}
                                    // fileCallback={upload}
                                    // isUploading={isUploading}
                                    dismissCallback={() => {
                                        rhfMethods.setValue('profile_photo_url', undefined, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })
                                    }}
                                    // imageSrc={safeString(rhfMethods.watch('profile_photo_url'))}
                                    label="Profile Picture"
                                    name="image_url"
                                    validation={{
                                        maxByteSize: 5242880, // 5MB
                                    }}
                                />
                            </div>
                            <div className="col-span-1">
                                <ImageUpload
                                    hero
                                    shape="square"
                                    hint="Optional"
                                    acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
                                    // error={rhfMethods.formState.errors?.profile_photo_url?.message}
                                    // fileCallback={upload}
                                    // isUploading={isUploading}
                                    dismissCallback={() => {
                                        rhfMethods.setValue('profile_photo_url', undefined, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })
                                    }}
                                    // imageSrc={safeString(rhfMethods.watch('profile_photo_url'))}
                                    label="Profile Picture"
                                    name="image_url"
                                    validation={{
                                        maxByteSize: 5242880, // 5MB
                                    }}
                                />
                            </div>
                        </div>
                    </form>
                </Form>
            </CardContent>

            <CardFooter className="flex justify-end">
                <div className="flex flex-row items-center space-x-2">
                    <Button disabled>Save</Button>
                </div>
            </CardFooter>
        </Card>
    )
}