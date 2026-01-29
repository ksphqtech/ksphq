import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Mail, Phone, Globe, MapPin, Calendar, Users, DollarSign } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getBusinessInfo, updateBusinessInfo, initializeBusinessInfo } from '@/lib/businessInfo'
import { toast } from 'sonner'

export function BusinessInfoPage() {
  const { user } = useAuth()
  const [businessInfo, setBusinessInfo] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    initializeBusinessInfo()
    const info = getBusinessInfo()
    setBusinessInfo(info)
    setFormData(info)
  }, [])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData(businessInfo)
    setIsEditing(false)
  }

  const handleSave = () => {
    const updated = updateBusinessInfo(formData)
    setBusinessInfo(updated)
    setIsEditing(false)
    toast.success('Business information updated successfully!')
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const InfoField = ({ label, value, icon: Icon, field, type = 'text' }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {label}
      </label>
      {isEditing && isAdmin ? (
        <Input
          type={type}
          value={formData[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
        />
      ) : (
        <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
          {value || 'Not set'}
        </p>
      )}
    </div>
  )

  if (!businessInfo) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          Loading...
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Business Information</h1>
            <p className="text-muted-foreground">
              View and manage your company details
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={handleEdit}>Edit Information</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </>
              )}
            </div>
          )}
          {!isAdmin && (
            <Badge variant="outline">Read Only</Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Company Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Details
              </CardTitle>
              <CardDescription>Basic information about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoField
                label="Company Name"
                value={businessInfo.companyName}
                icon={Building2}
                field="companyName"
              />
              <InfoField
                label="Industry"
                value={businessInfo.industry}
                field="industry"
              />
              <InfoField
                label="Founded Date"
                value={businessInfo.foundedDate}
                icon={Calendar}
                field="foundedDate"
                type="date"
              />
              <InfoField
                label="Employee Count"
                value={businessInfo.employeeCount}
                icon={Users}
                field="employeeCount"
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                {isEditing && isAdmin ? (
                  <textarea
                    className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                    {businessInfo.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>How to reach your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoField
                label="Email"
                value={businessInfo.email}
                icon={Mail}
                field="email"
                type="email"
              />
              <InfoField
                label="Phone"
                value={businessInfo.phone}
                icon={Phone}
                field="phone"
                type="tel"
              />
              <InfoField
                label="Website"
                value={businessInfo.website}
                icon={Globe}
                field="website"
                type="url"
              />
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address
              </CardTitle>
              <CardDescription>Physical business location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoField
                label="Street Address"
                value={businessInfo.address}
                field="address"
              />
              <div className="grid grid-cols-2 gap-4">
                <InfoField
                  label="City"
                  value={businessInfo.city}
                  field="city"
                />
                <InfoField
                  label="State"
                  value={businessInfo.state}
                  field="state"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoField
                  label="ZIP Code"
                  value={businessInfo.zipCode}
                  field="zipCode"
                />
                <InfoField
                  label="Country"
                  value={businessInfo.country}
                  field="country"
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Business Settings
              </CardTitle>
              <CardDescription>Regional and operational settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoField
                label="Timezone"
                value={businessInfo.timezone}
                field="timezone"
              />
              <InfoField
                label="Currency"
                value={businessInfo.currency}
                field="currency"
              />
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Changes to business settings will affect all users and
                  system-wide configurations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
