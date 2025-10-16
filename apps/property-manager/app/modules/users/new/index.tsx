import { HelpCircle, Mail, Phone } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "~/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { TypographyH1, TypographyMuted } from "~/components/ui/typography";

export function NewUserModule() {
    return (
        <div className="mx-2 md:mx-auto max-w-lg ">
            <div className="space-y-1">
                <TypographyH1>Create New User</TypographyH1>
                <TypographyMuted>
                    We&apos;ll send the user an invitation to join via email/phone number
                </TypographyMuted>
            </div>

            <FieldGroup className="mt-10">
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="name">Full Name</FieldLabel>
                        <Input id="name" type="text" placeholder="John Doe" required />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <InputGroup>
                            <InputGroupInput placeholder="m@example.com" />
                            <InputGroupAddon>
                                <Mail />
                                <Separator
                                    orientation="vertical"
                                    className=" data-[orientation=vertical]:h-4"
                                />
                            </InputGroupAddon>
                            <InputGroupAddon align="inline-end">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <InputGroupButton
                                            variant="ghost"
                                            aria-label="Help"
                                            size="icon-xs"
                                        >
                                            <HelpCircle />
                                        </InputGroupButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>We&apos;ll use this to send you notifications</p>
                                    </TooltipContent>
                                </Tooltip>
                            </InputGroupAddon>
                        </InputGroup>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                        <InputGroup>
                            <InputGroupInput id='phone' type="tel" placeholder="201234567" />
                            <InputGroupAddon>
                                <Phone />
                                +233
                                <Separator
                                    orientation="vertical"
                                    className=" data-[orientation=vertical]:h-4"
                                />
                            </InputGroupAddon>
                            <InputGroupAddon align="inline-end">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <InputGroupButton
                                            variant="ghost"
                                            aria-label="Help"
                                            size="icon-xs"
                                        >
                                            <HelpCircle />
                                        </InputGroupButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>We&apos;ll use this to send you notifications</p>
                                    </TooltipContent>
                                </Tooltip>
                            </InputGroupAddon>
                        </InputGroup>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="role">Role</FieldLabel>
                        <Select>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="__EMPTY__">Please select</SelectItem>
                                    <SelectLabel>All Roles</SelectLabel>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="STAFF">Staff</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </Field>
                </FieldGroup>
            </FieldGroup>

            <div className="flex justify-end border-t pt-5 mt-10">
                <div className="flex items-center gap-x-2">
                    <Link to='/users'>
                        <Button type="button" variant='outline'>Cancel</Button>
                    </Link>
                    <Button type="submit" className="bg-rose-600 hover:bg-rose-700">Create User</Button>
                </div>
            </div>
        </div>
    )
}