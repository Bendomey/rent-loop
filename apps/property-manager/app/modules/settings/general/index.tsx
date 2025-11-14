import { Edit, Trash } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { TypographyH3, TypographyH4, TypographyMuted } from '~/components/ui/typography'

export function GeneralSettingsModule() {
    
  return (
    <div className="mx-auto max-w-4xl px-4 pt-1 pb-10 space-y-8">
      <div className="space-y-1">
        <TypographyH3>General Settings</TypographyH3>
        <TypographyMuted>Update and manage your essential information.</TypographyMuted>
      </div>

      <Separator />

      {/* Logo Section */}
      <section className="grid gap-6 sm:grid-cols-3 sm:items-center ">
        <div className="space-y-1 flex-1">
          <TypographyH4>Property Logo</TypographyH4>
          <TypographyMuted className="text-sm">
            Your logo appears on emails, invoices and your dashboard.
          </TypographyMuted>
        </div>

        <div className="sm:col-span-2  flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar className="h-20 w-20 shadow-md ring-1 ring-border">
            <AvatarImage src="https://github.com/shadcn.png" alt="Company Logo" />
            <AvatarFallback>CL</AvatarFallback>
          </Avatar>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Edit className="size-4" />
              Update Logo
            </Button>

            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-rose-600 hover:text-rose-700">
              <Trash className="size-4" />
              Remove
            </Button>
          </div>
        </div>
        
      </section>


      {/* Basic Details */}
      <section className="grid gap-6 rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <TypographyH3>Basic Details</TypographyH3>
        <Button variant="outline" size="sm" className="flex items-center gap-2 underline">
          <Edit className="size-4" /> Edit Details
        </Button>
      </div>
      <Separator />
        <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
          <FieldLabel htmlFor="owner_company_name">Name</FieldLabel>
          <Field className="sm:col-span-2">
            <Input id="owner_company_name" placeholder="Enter your company name" disabled />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Field className="sm:col-span-2">
            <Input id="email" placeholder="support@example.com" disabled />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
          <FieldLabel htmlFor="support_phone">Phone</FieldLabel>
          <Field className="sm:col-span-2">
            <Input id="support_phone" placeholder="(233) 277-456-7890" disabled />
          </Field>
        </div>
      </section>


      {/* Company Details */}
      <section className="grid gap-6 rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <TypographyH3>Company Details</TypographyH3>
        <Button variant="outline" size="sm" className="flex items-center gap-2 underline">
          <Edit className="size-4" /> Edit Details
        </Button>
      </div>
      <Separator />
        <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
          <FieldLabel htmlFor="owner_company_name">Company Name</FieldLabel>
          <Field className="sm:col-span-2">
            <Input id="owner_company_name" placeholder="Enter your company name" disabled />
          </Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 items-center">
<FieldLabel htmlFor="description">Description</FieldLabel>
<Field className="sm:col-span-2">
<Input id="description" placeholder="Enter description (optional)" />
</Field>
</div>

        <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
          <FieldLabel htmlFor="email">Support Email</FieldLabel>
          <Field className="sm:col-span-2">
            <Input id="email" placeholder="support@example.com" disabled />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
          <FieldLabel htmlFor="support_phone">Support Phone</FieldLabel>
          <Field className="sm:col-span-2">
            <Input id="support_phone" placeholder="(233) 277-456-7890" disabled />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
          <FieldLabel htmlFor="registration_number">Registration Number</FieldLabel>
          <Field className="sm:col-span-2">
            <Input id="registration_number" placeholder="Company registration number" disabled/>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 sm:items-center">
          <FieldLabel htmlFor="website_url">Website</FieldLabel>
          <Field className="sm:col-span-2">
            <Input id="website_url" placeholder="https://example.com" disabled/>
          </Field>
        </div>
      </section>

        {/*  Type */}
       <section className="grid gap-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <TypographyH3>Property Owner Type </TypographyH3>
          <Button variant="outline" size="sm" className="flex items-center gap-2 underline">
            <Edit className="size-4" /> Edit
          </Button>
        </div>
        <Separator />
<div className="grid sm:grid-cols-3 gap-4 items-center">
<FieldLabel htmlFor="type">Type</FieldLabel>
<Field className="sm:col-span-2">
<Input id="type" placeholder="COMPANY" />
</Field>
</div>


<div className="grid sm:grid-cols-3 gap-4 items-center">
<FieldLabel htmlFor="sub_type">Sub Type</FieldLabel>
<Field className="sm:col-span-2">
<Input id="sub_type" placeholder="LANDLORD" />
</Field>
</div>



      </section>


      {/* Location */}
     <section className="grid gap-8 sm:grid-cols-3 sm:items-start rounded-xl border bg-card p-6 shadow-sm">
  <div className="space-y-2">
    <TypographyH4 className="font-semibold text-lg">Business Location</TypographyH4>
    <FieldDescription className="text-sm text-muted-foreground">
      Update your company's official physical address.
    </FieldDescription>
  </div>

  <div className="sm:col-span-2 space-y-6">
    {/* Address */}
    <Field className="space-y-2">
      <div className="flex items-center justify-between">
        <FieldLabel className="font-medium">Address</FieldLabel>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 hover:bg-muted transition"
        >
          <Edit className="size-4" />
          Edit Address
        </Button>
      </div>

      <Input
        id="address"
        placeholder="Madina Estate, Pentecost School"
        className="h-11"
      />
    </Field>

    {/* Country / Region / City */}
    <div className="grid sm:grid-cols-3 gap-6">
      <div className="space-y-1">
        <Label className="text-sm font-medium">Country</Label>
        <TypographyMuted className="text-sm">Ghana</TypographyMuted>
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">Region</Label>
        <TypographyMuted className="text-sm">Greater Accra</TypographyMuted>
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">City</Label>
        <TypographyMuted className="text-sm">Madina Estate</TypographyMuted>
      </div>
    </div>
  </div>
</section>

    </div>
  )
}