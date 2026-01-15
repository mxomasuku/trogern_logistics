// HIGHLIGHT: Sample Dashboard Gallery Page
import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "../LandingPage/PublicNavbar";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ArrowLeft } from "lucide-react";

// HIGHLIGHT: Define your screenshot images here
// These match the actual files in public/assets/screenshots/
const dashboardScreenshots = [
    {
        id: 1,
        title: "Vehicle Details",
        description: "Deep dive into individual vehicle performance, service history, and profitability.",
        src: "/assets/screenshots/vehicle-details.png",
    },
    {
        id: 2,
        title: "Service & Maintenance",
        description: "Keep track of service schedules, maintenance history, and upcoming reminders.",
        src: "/assets/screenshots/service-maintenance.png",
    },
    {
        id: 3,
        title: "Set Business Targets",
        description: "Define weekly and monthly targets for your fleet to track performance against goals.",
        src: "/assets/screenshots/set-business-targets.png",
    },
    {
        id: 4,
        title: "Invite Team Members",
        description: "Easily invite drivers, managers, and staff to collaborate on your fleet operations.",
        src: "/assets/screenshots/invite-team.png",
    },
    {
        id: 5,
        title: "Real-Time Support",
        description: "Get instant help and support directly within the dashboard when you need it.",
        src: "/assets/screenshots/real-time-support.png",
    },
];

const publicLightNavTheme = {
    textPrimaryClassName: "text-slate-900",
    cardBorderClassName: "border-slate-200",
    accentColor: "#4B67FF",
    buttonPrimaryColor: "#4B67FF",
};

export default function SampleDashboardPage() {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? dashboardScreenshots.length - 1 : prev - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prev) =>
            prev === dashboardScreenshots.length - 1 ? 0 : prev + 1
        );
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") goToPrevious();
        if (e.key === "ArrowRight") goToNext();
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 text-slate-800"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <PublicNavbar
                textPrimaryClassName={publicLightNavTheme.textPrimaryClassName}
                cardBorderClassName={publicLightNavTheme.cardBorderClassName}
                accentColor={publicLightNavTheme.accentColor}
                buttonPrimaryColor={publicLightNavTheme.buttonPrimaryColor}
            />

            <main className="max-w-6xl mx-auto px-6 lg:px-10 py-12 space-y-12">
                {/* Back Button */}
                <Link
                    to="/product-overview"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Product Overview
                </Link>

                {/* Hero Section */}
                <section className="space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Dashboard Preview
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
                        See Trogern in action
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        Explore the dashboard that powers African fleet operators. Click any
                        screenshot to view it in full size.
                    </p>
                </section>

                {/* Screenshot Grid */}
                <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardScreenshots.map((screenshot, index) => (
                        <motion.div
                            key={screenshot.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative rounded-2xl border border-slate-200 bg-white/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                            onClick={() => openLightbox(index)}
                        >
                            {/* Screenshot Image */}
                            <div className="aspect-video relative overflow-hidden bg-slate-100">
                                <img
                                    src={screenshot.src}
                                    alt={screenshot.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        // Fallback placeholder if image doesn't exist yet
                                        (e.target as HTMLImageElement).src =
                                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect fill='%23e2e8f0' width='400' height='225'/%3E%3Ctext fill='%2394a3b8' font-family='system-ui' font-size='16' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EScreenshot Coming Soon%3C/text%3E%3C/svg%3E";
                                    }}
                                />

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                    <span className="inline-flex items-center gap-2 text-white text-sm font-medium bg-blue-600/80 backdrop-blur-sm px-4 py-2 rounded-full">
                                        <ZoomIn className="w-4 h-4" />
                                        View Full Size
                                    </span>
                                </div>
                            </div>

                            {/* Caption */}
                            <div className="p-4">
                                <h3 className="font-semibold text-slate-900 mb-1">
                                    {screenshot.title}
                                </h3>
                                <p className="text-sm text-slate-600">{screenshot.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </section>

                {/* CTA Section */}
                <section className="text-center space-y-6 pt-8">
                    <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 px-6 py-10 md:px-10 md:py-12 text-white shadow-lg">
                        <h2 className="text-2xl md:text-3xl font-semibold">
                            Ready to see this with your own fleet data?
                        </h2>
                        <p className="mt-3 text-sm md:text-base text-blue-100 max-w-2xl mx-auto">
                            Sign up today and get your first vehicle set up in minutes. No
                            credit card required.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-4">
                            <Link
                                to="/signup"
                                className="px-6 py-3 rounded-full bg-white text-blue-700 font-semibold shadow hover:bg-blue-50 transition"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                to="/product-overview"
                                className="px-6 py-3 rounded-full border border-blue-100 text-white/90 bg-white/10 hover:bg-white/15 transition"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm"
                        onClick={closeLightbox}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeLightbox}
                            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Navigation - Previous */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPrevious();
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition"
                            aria-label="Previous"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>

                        {/* Navigation - Next */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNext();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition"
                            aria-label="Next"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>

                        {/* Image Container */}
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-[90vw] max-h-[85vh] relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={dashboardScreenshots[currentIndex].src}
                                alt={dashboardScreenshots[currentIndex].title}
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect fill='%231e293b' width='800' height='450'/%3E%3Ctext fill='%2394a3b8' font-family='system-ui' font-size='24' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EScreenshot Coming Soon%3C/text%3E%3C/svg%3E";
                                }}
                            />

                            {/* Caption */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900/80 to-transparent rounded-b-lg">
                                <h3 className="text-white font-semibold text-lg">
                                    {dashboardScreenshots[currentIndex].title}
                                </h3>
                                <p className="text-white/70 text-sm">
                                    {dashboardScreenshots[currentIndex].description}
                                </p>
                                <p className="text-white/50 text-xs mt-2">
                                    {currentIndex + 1} of {dashboardScreenshots.length}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
