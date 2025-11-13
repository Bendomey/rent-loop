import { Edit, Trash } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Field, FieldDescription, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { TypographyH3, TypographyH4, TypographyMuted } from '~/components/ui/typography'

export function GeneralSettingsModule() {
    return (
        <div className="mx-auto max-w-4xl px-4 pt-1 pb-6">
            <header className="mb-6">
                <TypographyH3>Settings</TypographyH3>
                <TypographyMuted className="mt-1">Manage your account preferences</TypographyMuted>
            </header>

            <Separator className="bg-muted mb-6 h-px" />

            <section className="mb-6 grid gap-6 sm:grid-cols-3 sm:items-center">
                <div className="sm:col-span-1">
                    <TypographyH4>Your Photo</TypographyH4>
                    <TypographyMuted className="text-sm">This will be displayed on your profile.</TypographyMuted>
                </div>

                <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4">
                    <Avatar className="h-20 w-20 flex-shrink-0">
                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Edit />
                            Update
                        </Button>

                        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-rose-600">
                            <Trash />
                            Delete
                        </Button>

                        <TypographyMuted className="text-sm mt-2 sm:mt-0">
                            Supported formats: PNG, JPG. Max 2MB.
                        </TypographyMuted>
                    </div>
                </div>
            </section>

            <Separator className="bg-muted mb-6 h-px" />

            <section className="mb-6">
                <div className="grid gap-6">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">
                        <FieldLabel className="block sm:col-span-1" htmlFor="username">
                            Username
                        </FieldLabel>
                        <Field className="sm:col-span-2">
                            <Input id="username" type="text" placeholder="Enter your username" disabled />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">
                        <FieldLabel className="block sm:col-span-1" htmlFor="email">
                            Email
                        </FieldLabel>
                        <Field className="sm:col-span-2">
                            <Input id="email" type="text" placeholder="account@email.com" disabled />
                        </Field>
                    </div>
                </div>
            </section>

            <Separator className="bg-muted mb-6 h-px" />

            <section className="mb-6 grid gap-6">
                <div className="grid gap-4 sm:grid-cols-3 sm:items-start">
                    <div>
                        <TypographyH4>Email view options</TypographyH4>
                        <FieldDescription className="text-sm">
                            Write a short introduction.
                        </FieldDescription>
                    </div>

                    <div className="sm:col-span-2 space-y-4">
                        <div className="flex items-start gap-3">
                            <Checkbox id="truncate" defaultChecked />
                            <div>
                                <Label htmlFor="truncate">Truncate long translations in the editor</Label>
                                <TypographyMuted className="text-sm">
                                    Easily customizable global styles
                                </TypographyMuted>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Checkbox id="spelling" defaultChecked />
                            <div>
                                <Label htmlFor="spelling">Show spelling and grammar errors in the editor</Label>
                                <TypographyMuted className="text-sm">
                                    Enable inline suggestions and corrections
                                </TypographyMuted>
                            </div>
                        </div>

                            <div className="pt-3">
                                <Input id="hotkey_profile" type="text" placeholder="Edit Hotkey Profile" />
                                <Link to="#" className="text-sm underline underline-offset-4 mt-2 inline-block">
                                    Show available hotkeys
                                </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Separator className="bg-muted mb-6 h-px" />

            <section className="mb-6 grid gap-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">
                    <FieldLabel className="block sm:col-span-1" htmlFor="language">
                        Language
                    </FieldLabel>
                    <Field className="sm:col-span-2">
                        <Input id="language" type="text" placeholder="Select language" disabled />
                    </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">
                    <FieldLabel className="block sm:col-span-1" htmlFor="timezone">
                        Timezone
                    </FieldLabel>
                    <Field className="sm:col-span-2">
                        <Input id="timezone" type="text" placeholder="Select timezone" disabled />
                    </Field>
                </div>
            </section>

            <footer className="flex items-center justify-end gap-3">
                <Button variant="ghost" size="sm">
                    Cancel
                </Button>
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
                    Save changes
                </Button>
            </footer>
        </div>
    )
}
