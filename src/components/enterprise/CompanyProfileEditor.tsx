// Company Profile Editor - ERP Configuration
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building, Globe, Clock, DollarSign, Save, RotateCcw } from "lucide-react";
import {
  getCompanyProfile,
  updateCompanyProfile,
  resetConfiguration,
} from "@/services/config-engine";
import type { CompanyProfile } from "@/types/configuration";

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export function CompanyProfileEditor() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    getCompanyProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  const handleSave = () => {
    if (profile) updateCompanyProfile(profile);
  };

  const handleReset = () => {
    resetConfiguration();
    getCompanyProfile().then(setProfile).catch(() => setProfile(null));
  };

  const toggleDay = (day: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workingDays: prev.workingDays?.includes(day)
          ? prev.workingDays.filter((d) => d !== day)
          : [...(prev.workingDays || []), day].sort(),
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Company Profile</h3>
          <p className="text-sm text-muted-foreground">
            Configure your organization's profile and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="size-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Building className="size-3.5 mr-1.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="regional">
            <Globe className="size-3.5 mr-1.5" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="business">
            <Clock className="size-3.5 mr-1.5" />
            Business Hours
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="size-3.5 mr-1.5" />
            Financial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Company Name</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Legal Name</Label>
                    <Input
                      value={profile.legalName}
                      onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                    />
                  </div>
                </div>
              )}
              {profile && (
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Textarea
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    rows={2}
                  />
                </div>
              )}
              {profile && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>TIN</Label>
                    <Input
                      value={profile.tin || ""}
                      onChange={(e) => setProfile({ ...profile, tin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Number</Label>
                    <Input
                      value={profile.contactNumber || ""}
                      onChange={(e) => setProfile({ ...profile, contactNumber: e.target.value })}
                    />
                  </div>
                </div>
              )}
              {profile && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={profile.email || ""}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input
                      value={profile.website || ""}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Regional Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={profile?.defaultTimezone || ""}
                    onChange={(e) => profile && setProfile({ ...profile, defaultTimezone: e.target.value })}
                  >
                    <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                    <option value="America/Chicago">America/Chicago (UTC-6)</option>
                    <option value="Europe/London">Europe/London (UTC+0)</option>
                    <option value="Europe/Berlin">Europe/Berlin (UTC+1)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={profile?.language || ""}
                    onChange={(e) => profile && setProfile({ ...profile, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="fil">Filipino</option>
                    <option value="ceb">Cebuano</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date Format</Label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={profile?.dateFormat || ""}
                    onChange={(e) => profile && setProfile({ ...profile, dateFormat: e.target.value })}
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Time Format</Label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={profile?.timeFormat || ""}
                    onChange={(e) => profile && setProfile({ ...profile, timeFormat: e.target.value })}
                  >
                    <option value="HH:mm">24-Hour (14:30)</option>
                    <option value="hh:mm A">12-Hour (2:30 PM)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Business Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile && (
                <div>
                  <Label className="mb-2 block">Working Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          profile!.workingDays?.includes(day.value)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-muted-foreground"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  {profile && (
                    <Input
                      type="time"
                      value={profile.businessHoursStart || ""}
                      onChange={(e) => setProfile({ ...profile, businessHoursStart: e.target.value })}
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  {profile && (
                    <Input
                      type="time"
                      value={profile.businessHoursEnd || ""}
                      onChange={(e) => setProfile({ ...profile, businessHoursEnd: e.target.value })}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Financial Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Input
                      value={profile.currency || ""}
                      onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency Symbol</Label>
                    <Input
                      value={profile.currencySymbol || ""}
                      onChange={(e) => setProfile({ ...profile, currencySymbol: e.target.value })}
                    />
                  </div>
                </div>
              )}
              {profile && (
                <div className="space-y-1.5">
                  <Label>Fiscal Year Start</Label>
                  <Input
                    type="text"
                    value={profile.fiscalYearStart || ""}
                    onChange={(e) => setProfile({ ...profile, fiscalYearStart: e.target.value })}
                    placeholder="MM-DD"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Format: MM-DD (e.g., 01-01 for January 1)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
