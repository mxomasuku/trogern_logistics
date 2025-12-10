// src/pages/support/components/ContactCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface ContactCardProps {
    email?: string;
    whatsAppNumber?: string;
    supportHours?: string;
}

export function ContactCard({
    email = "support@trogern.com",
    whatsAppNumber = "263771234567",
    supportHours = "Monday to Friday, 8am - 6pm CAT",
}: ContactCardProps) {
    const handleEmail = () => {
        window.open(`mailto:${email}`);
    };

    const handleWhatsApp = () => {
        window.open(`https://wa.me/${whatsAppNumber}`, "_blank");
    };

    return (
        <section className="mt-8">
            <Card className="bg-gradient-to-br from-blue-600 to-sky-500 text-white rounded-xl shadow-md border-0">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">Need immediate help?</h3>
                            <p className="text-blue-100 text-sm mt-1">
                                Our support team is available {supportHours}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                                onClick={handleEmail}
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Email Us
                            </Button>
                            <Button
                                className="bg-white text-blue-600 hover:bg-blue-50"
                                onClick={handleWhatsApp}
                            >
                                WhatsApp
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
