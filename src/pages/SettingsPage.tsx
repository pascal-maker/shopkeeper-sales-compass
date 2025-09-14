import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings, Language, Currency } from "@/contexts/SettingsContext";

const SettingsPage = () => {
  const { language, currency, setLanguage, setCurrency, t } = useSettings();

  const languages = [
    { value: 'en' as Language, label: t('english'), flag: '🇺🇸' },
    { value: 'fr' as Language, label: t('french'), flag: '🇫🇷' },
  ];

  const currencies = [
    { value: 'SLL' as Currency, label: t('sll'), flag: '🇸🇱' },
    { value: 'GNF' as Currency, label: t('gnf'), flag: '🇬🇳' },
    { value: 'XOF' as Currency, label: t('xof'), flag: '🇨🇫' },
    { value: 'USD' as Currency, label: t('usd'), flag: '🇺🇸' },
    { value: 'EUR' as Currency, label: t('eur'), flag: '🇪🇺' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">{t('settings')}</h1>
        </div>
      </div>

      <div className="container px-4 py-6 space-y-6">
        {/* Language Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('language')}</CardTitle>
            <CardDescription>
              {t('languageDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={language}
              onValueChange={(value) => setLanguage(value as Language)}
              className="space-y-3"
            >
              {languages.map((lang) => (
                <div key={lang.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={lang.value} id={lang.value} />
                  <Label 
                    htmlFor={lang.value} 
                    className="flex items-center space-x-2 cursor-pointer flex-1"
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Currency Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('currency')}</CardTitle>
            <CardDescription>
              {t('currencyDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{curr.flag}</span>
                      <span>{curr.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Current Settings Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('currentSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('languageLabel')}</span>
              <span className="font-medium">
                {languages.find(l => l.value === language)?.flag} {languages.find(l => l.value === language)?.label}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('currencyLabel')}</span>
              <span className="font-medium">
                {currencies.find(c => c.value === currency)?.flag} {currency}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;