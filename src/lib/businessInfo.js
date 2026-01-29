// Business Info utility functions

export const DEFAULT_BRANDING = {
  logoText: 'KSP',
  logoBackgroundColor: 'hsl(222.2, 47.4%, 11.2%)',
  displayName: 'KSP HQ',
  subtitle: 'Business Tools Platform'
};

export const DEFAULT_BUSINESS_INFO = {
  companyName: 'KSP HQ Demo Company',
  industry: 'Logistics & Warehousing',
  foundedDate: '2020-01-15',
  address: '123 Business Park Drive',
  city: 'Enterprise City',
  state: 'CA',
  zipCode: '90210',
  country: 'United States',
  phone: '+1 (555) 123-4567',
  email: 'contact@ksphq.com',
  website: 'https://ksphq.com',
  timezone: 'America/Los_Angeles',
  currency: 'USD',
  employeeCount: '50-100',
  description: 'A leading business tools platform for modern operations management.',
  branding: DEFAULT_BRANDING
}

export const initializeBusinessInfo = () => {
  const businessInfo = localStorage.getItem('businessInfo')
  if (!businessInfo) {
    localStorage.setItem('businessInfo', JSON.stringify(DEFAULT_BUSINESS_INFO))
  }
}

export const getBusinessInfo = () => {
  const businessInfo = localStorage.getItem('businessInfo')
  return businessInfo ? JSON.parse(businessInfo) : DEFAULT_BUSINESS_INFO
}

export const updateBusinessInfo = (updates) => {
  const current = getBusinessInfo()
  const updated = { ...current, ...updates }
  localStorage.setItem('businessInfo', JSON.stringify(updated))
  return updated
}

export const getBranding = () => {
  const businessInfo = getBusinessInfo()
  return businessInfo.branding || DEFAULT_BRANDING
}

export const updateBranding = (brandingData) => {
  const current = getBusinessInfo()
  const updated = {
    ...current,
    branding: {
      ...current.branding,
      ...brandingData
    }
  }
  localStorage.setItem('businessInfo', JSON.stringify(updated))
  return updated.branding
}

export const resetBranding = () => {
  const current = getBusinessInfo()
  const updated = {
    ...current,
    branding: { ...DEFAULT_BRANDING }
  }
  localStorage.setItem('businessInfo', JSON.stringify(updated))
  return updated.branding
}
