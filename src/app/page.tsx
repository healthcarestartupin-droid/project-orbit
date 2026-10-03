"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Check, ChevronDown, ArrowRight } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { submitExperience } from "./actions";

export default function Home() {
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  
  // Form step 1: Role
  const [role, setRole] = useState<string | null>(null);
  
  // Form step 2: The main problem
  const [message, setMessage] = useState("");
  
  // Form step 3: Solution (optional)
  const [solution, setSolution] = useState("");
  
  // Turnstile
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  
  // UI states
  const [showSecondQuestion, setShowSecondQuestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  const textareaRef1 = useRef<HTMLTextAreaElement>(null);
  const textareaRef2 = useRef<HTMLTextAreaElement>(null);

  const roles = [
    { id: "patient", label: "Patient" },
    { id: "family", label: "Family / Caregiver" },
    { id: "doctor", label: "Doctor" },
    { id: "nurse", label: "Nurse" },
    { id: "staff", label: "Healthcare Staff" },
    { id: "other", label: "Other" },
  ];

  const roleSuggestions: Record<string, string[]> = {
    patient: ["Understanding what was happening", "Finding the right care", "Keeping track of health information", "Managing medicines"],
    family: ["Managing someone else's care", "Understanding what the doctor said", "Keeping reports and history together", "Knowing what to do next"],
    doctor: ["Incomplete patient history", "Repeated history-taking", "Scattered information", "Communication with patients"],
    nurse: ["Missing patient context", "Communication gaps", "Workflow problems", "Too much manual work"],
    staff: ["Missing patient context", "Communication gaps", "Workflow problems", "Too much manual work"],
    other: ["What took too long?", "What was confusing?", "What was harder than it should have been?", "What did you need but couldn't get?"],
  };

  const defaultSuggestions = ["What took too long?", "What was confusing?", "What was harder than it should have been?", "What did you need but couldn't get?"];

  const currentSuggestions = role ? (roleSuggestions[role] || defaultSuggestions) : defaultSuggestions;

  const handleSuggestionClick = (suggestion: string) => {
    setMessage((prev) => (prev ? `${prev} ${suggestion}... ` : `${suggestion}... `));
    setTimeout(() => {
      if (textareaRef1.current) {
        textareaRef1.current.focus();
        const length = textareaRef1.current.value.length;
        textareaRef1.current.setSelectionRange(length, length);
      }
    }, 10);
  };

  const autoResize = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  };

  useEffect(() => { autoResize(textareaRef1); }, [message]);
  useEffect(() => { autoResize(textareaRef2); }, [solution]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!message.trim() || !role) return;
    
    // Allow submission even in local dev without Turnstile key, but warn if missing in prod
    if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setSubmitError("Please complete the security check.");
      return;
    }
    
    setIsSubmitting(true);
    
    const result = await submitExperience({
      role,
      message,
      solution,
      turnstileToken,
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
      setShowSecondQuestion(false);
    } else {
      setSubmitError(result.error || "Failed to submit. Please try again.");
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setMessage("");
    setSolution("");
    setRole(null);
    setShowSecondQuestion(false);
    setSubmitError(null);
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-sand font-sans selection:bg-[#111111] selection:text-white pb-32">
      {/* Floating Navigation */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 animate-slide-down">
        <div className="relative">
          <div className="flex items-center gap-3 bg-[rgba(17,17,17,0.88)] backdrop-blur-[12px] border border-white/10 rounded-full px-5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <span className="text-white text-[11px] font-semibold tracking-[0.2em] uppercase opacity-95">
              Building for health
            </span>
            <div className="w-[1px] h-3.5 bg-white/20"></div>
            <button 
              onClick={() => setNavMenuOpen(!navMenuOpen)}
              className="text-white/80 hover:text-white transition-transform active:scale-95 duration-200 p-0.5"
              aria-label="Toggle menu"
              aria-expanded={navMenuOpen}
            >
              <Plus className={`w-4 h-4 transition-transform duration-300 ${navMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
            </button>
          </div>
          
          {/* Dropdown Menu */}
          <div className={`absolute top-full right-0 mt-3 bg-[rgba(17,17,17,0.95)] backdrop-blur-md border border-white/10 rounded-2xl shadow-xl w-48 overflow-hidden origin-top-right transition-all duration-300 ${navMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="flex flex-col py-2">
              <a href="#why-we-ask" onClick={() => setNavMenuOpen(false)} className="px-5 py-2.5 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">Why we&apos;re asking</a>
              <a href="#share" onClick={() => setNavMenuOpen(false)} className="px-5 py-2.5 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">Share a problem</a>
              <a href="#privacy" onClick={() => setNavMenuOpen(false)} className="px-5 py-2.5 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-24 px-6 max-w-4xl mx-auto animate-fade-in flex flex-col items-start justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(17,17,17,0.10)] bg-[#F4F3EF] text-[11px] font-semibold tracking-widest text-[#111111] uppercase mb-12">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
          Listening First
        </div>
        
        <h1 className="text-hero font-serif text-[#111111] mb-6 max-w-3xl leading-[1.05]">
          Healthcare has problems.<br />
          <span className="italic">You&apos;ve probably faced one.</span>
        </h1>
        
        <h2 className="text-xl md:text-2xl font-serif italic text-[#111111] mb-12">
          Tell us which.
        </h2>
        
        <div className="max-w-xl text-body-large text-[#666666] mb-14 flex flex-col gap-6 leading-relaxed">
          <p>
            We&apos;re building something to help solve the problems people face across healthcare.
          </p>
          <p>
            Before we reveal what it is, we want to understand what still isn&apos;t working.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <a href="#share" className="inline-flex items-center justify-center gap-2 bg-[#111111] text-white px-8 py-4 rounded-full font-medium transition-transform hover:-translate-y-0.5 active:translate-y-0 duration-200 w-fit">
            Tell us what didn&apos;t work <ArrowRight className="w-4 h-4" />
          </a>
          <span className="text-[13px] text-[#666666]">No account. No name required. Just your experience.</span>
        </div>
      </section>

      {/* Main Conversational Interaction */}
      <section id="share" className="py-24 px-6 max-w-3xl mx-auto scroll-mt-24">
        <div className="relative">
          {/* Very subtle ambient glow */}
          <div className="absolute inset-0 bg-white/20 blur-[100px] -z-10 rounded-[4rem]"></div>
          
          {!isSubmitted ? (
            <div className="animate-fade-up">
              <div className="mb-12">
                <h2 className="text-editorial font-serif text-[#111111] mb-4">Every side of healthcare sees something different.</h2>
                <p className="text-[#666666] text-lg">Which side are you speaking from?</p>
              </div>
              
              <div className="flex flex-wrap gap-2.5 mb-16">
                {roles.map((r) => {
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`px-5 py-2.5 rounded-full border text-[13px] transition-all duration-200 ${
                        isSelected 
                          ? 'border-[rgba(17,17,17,0.2)] bg-[#EAE8E1] text-[#111111] font-medium' 
                          : 'border-[rgba(17,17,17,0.10)] bg-transparent text-[#666666] hover:border-[#111111]/20 hover:bg-[#F7F6F2]'
                      }`}
                    >
                      {r.label}
                    </button>
                  )
                })}
              </div>

              <div className={`transition-all duration-700 ease-out origin-top ${role ? 'opacity-100 scale-100 max-h-[1400px]' : 'opacity-0 scale-95 max-h-0 overflow-hidden'}`}>
                <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <h3 className="text-2xl font-serif text-[#111111]">What healthcare problem have you faced?</h3>
                  <span className="text-sm text-[#666666]">Start anywhere.</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {currentSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-[13px] px-4 py-2 rounded-full border border-[rgba(17,17,17,0.06)] bg-white/50 text-[#666666] hover:bg-white hover:border-[#111111]/15 hover:text-[#111111] transition-colors duration-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="relative group">
                    <textarea
                      ref={textareaRef1}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onFocus={() => setShowSecondQuestion(true)}
                      placeholder="Tell us what happened..."
                      className="w-full min-h-[160px] p-6 text-lg bg-white/60 backdrop-blur-sm border border-[rgba(17,17,17,0.10)] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] resize-none focus:outline-none focus:border-[rgba(17,17,17,0.3)] focus:bg-white transition-all duration-300 no-scrollbar"
                      required
                    />
                    <div className="mt-4 text-xs text-[#666666] leading-relaxed">
                      Please don&apos;t include names, phone numbers, email addresses, Aadhaar numbers, hospital IDs, medical reports, or other identifying information.
                    </div>
                  </div>

                  <div className={`transition-all duration-700 ease-out origin-top ${showSecondQuestion ? 'opacity-100 scale-100 max-h-[500px] mt-4' : 'opacity-0 scale-95 max-h-0 mt-0 overflow-hidden'}`}>
                    <h3 className="text-xl font-serif text-[#111111] mb-4">What would have made it easier? <span className="text-[#666666] italic font-sans text-base">(Optional)</span></h3>
                    <textarea
                      ref={textareaRef2}
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="A better way to..."
                      className="w-full min-h-[100px] p-5 text-base bg-white/60 backdrop-blur-sm border border-[rgba(17,17,17,0.10)] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] resize-none focus:outline-none focus:border-[rgba(17,17,17,0.3)] focus:bg-white transition-all duration-300 no-scrollbar"
                    />
                  </div>
                  
                  {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                    <div className={`transition-all duration-500 mt-2 ${showSecondQuestion ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                        onSuccess={(token) => setTurnstileToken(token)}
                        options={{ theme: "light" }}
                      />
                    </div>
                  )}

                  {submitError && (
                    <div className="text-[#111111] text-sm bg-[#EAE8E1] px-4 py-3 rounded-lg border border-[rgba(17,17,17,0.1)]">
                      {submitError}
                    </div>
                  )}
                  
                  <div className={`flex justify-end transition-all duration-500 mt-2 ${showSecondQuestion ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button
                      type="submit"
                      disabled={!message.trim() || isSubmitting}
                      className="inline-flex items-center justify-center gap-2 bg-[#111111] text-white px-8 py-4 rounded-full font-medium transition-all hover:bg-[#222222] disabled:opacity-40 disabled:cursor-not-allowed group"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-3">
                          <div className="w-4 h-4 border-[2px] border-white/20 border-t-white rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <>
                          Submit anonymously <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-16 text-center shadow-sm border border-[rgba(17,17,17,0.08)] animate-fade-in flex flex-col items-center max-w-xl mx-auto">
              <div className="w-12 h-12 bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center mb-8">
                <Check className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl font-serif text-[#111111] mb-6">Received ✓</h3>
              <p className="text-[#111111] text-xl font-serif italic mb-4">You just added one more piece to the picture.</p>
              <p className="text-[#666666] mb-12 text-sm leading-relaxed max-w-sm">We&apos;re collecting experiences from different sides of healthcare to understand where the real gaps are.</p>
              <button 
                onClick={resetForm}
                className="text-sm font-medium text-[#111111] border-b border-[rgba(17,17,17,0.15)] hover:border-[#111111] pb-1 transition-colors"
              >
                Share another problem
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Human Microcopy Statement */}
      <section className="py-24 px-6 max-w-3xl mx-auto border-t border-[rgba(17,17,17,0.06)] text-center">
        <p className="text-xl md:text-2xl font-serif italic text-[#666666] leading-relaxed">
          &quot;We don&apos;t need your story to be perfect.<br />
          We need it to be real.&quot;
        </p>
      </section>

      {/* Manifesto Section */}
      <section className="py-32 px-6 max-w-4xl mx-auto border-t border-[rgba(17,17,17,0.06)]">
        <h2 className="text-editorial font-serif text-[#111111] mb-4">We&apos;re not collecting complaints.</h2>
        <h3 className="text-editorial font-serif italic text-[#111111] mb-12">We&apos;re looking for patterns worth solving.</h3>
        
        <div className="max-w-xl text-body-large text-[#666666] leading-relaxed">
          <p className="mb-4">One experience can reveal a problem.</p>
          <p className="mb-4">Repeated experiences can reveal a pattern.</p>
          <p>Patterns can show us where a better answer is needed.</p>
        </div>
      </section>

      {/* Perspectives Section */}
      <section className="py-32 px-6 bg-[#F7F6F2] border-y border-[rgba(17,17,17,0.06)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif mb-20 text-[#111111] border-b border-[rgba(17,17,17,0.06)] pb-8">One healthcare journey. Many perspectives.</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
            <div className="flex flex-col">
              <h3 className="text-xs font-semibold tracking-[0.15em] text-[#111111] uppercase mb-4">Patient</h3>
              <p className="text-[#666666] text-sm">What they experience</p>
            </div>
            
            <div className="flex flex-col">
              <h3 className="text-xs font-semibold tracking-[0.15em] text-[#111111] uppercase mb-4">Family / Caregiver</h3>
              <p className="text-[#666666] text-sm">What they manage</p>
            </div>
            
            <div className="flex flex-col">
              <h3 className="text-xs font-semibold tracking-[0.15em] text-[#111111] uppercase mb-4">Doctor</h3>
              <p className="text-[#666666] text-sm">What they need to understand</p>
            </div>

            <div className="flex flex-col">
              <h3 className="text-xs font-semibold tracking-[0.15em] text-[#111111] uppercase mb-4">Healthcare Staff</h3>
              <p className="text-[#666666] text-sm">What they keep moving</p>
            </div>
          </div>
        </div>
      </section>

      {/* Purpose Section */}
      <section id="why-we-ask" className="py-32 px-6 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif text-[#111111] mb-10">Why are we asking?</h2>
          <div className="text-body-large text-[#666666] space-y-6 max-w-2xl mb-24">
            <p>We&apos;re already building something for healthcare.</p>
            <p>Before we reveal what it is, we want to understand the problems from every side of the journey.</p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 font-serif italic text-xl md:text-2xl text-[#111111] mb-16">
            <div className="flex items-center gap-6 md:gap-10">
              <span>You share</span>
              <ArrowRight className="w-6 h-6 text-[rgba(17,17,17,0.2)] hidden md:block" strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-6 md:gap-10">
              <span>We find patterns</span>
              <ArrowRight className="w-6 h-6 text-[rgba(17,17,17,0.2)] hidden md:block" strokeWidth={1.5} />
            </div>
            <div>
              <span>We explore what could improve them</span>
            </div>
          </div>
          
          <div className="text-[#666666] space-y-2">
            <p>You tell us.</p>
            <p>We listen.</p>
            <p>We look for patterns.</p>
            <p>We try to build around what matters.</p>
          </div>
        </div>
      </section>

      {/* Privacy & FAQ Section */}
      <section id="privacy" className="py-32 px-6 bg-white border-y border-[rgba(17,17,17,0.06)] scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif text-[#111111] mb-12">Privacy & Details</h2>
          
          <div className="mb-24 space-y-6">
            <p className="text-xl text-[#111111] font-medium">We don&apos;t ask for your name or contact details.</p>
            <p className="text-[#666666] max-w-2xl leading-relaxed">Please don&apos;t include names, phone numbers, email addresses, Aadhaar numbers, hospital IDs, medical reports, or other identifying information.</p>
            <p className="text-[#666666] max-w-2xl leading-relaxed">This is a healthcare problem-discovery project, not a medical advice service.</p>
          </div>

          <div className="max-w-3xl">
            <div className="space-y-0">
              {[
                { q: "Why are you anonymous?", a: "We want the focus to remain on the problems people face, not on a startup launch. Anonymity helps prevent bias during this research phase." },
                { q: "What happens to my response?", a: "It is aggregated into a qualitative dataset to identify structural inefficiencies and unmet needs across the care continuum." },
                { q: "Should I share my medical report?", a: "No. Do not share Protected Health Information (PHI). If any identifying details are accidentally included, they will be discarded." },
                { q: "Is this medical advice?", a: "No. This is purely a research initiative and does not provide or replace professional medical advice, diagnosis, or treatment." }
              ].map((faq, i) => (
                <div key={i} className="border-b border-[rgba(17,17,17,0.06)] last:border-0 overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between py-6 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20 rounded-lg"
                    aria-expanded={expandedFaq === i}
                  >
                    <span className="font-medium text-[#111111] text-lg">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-[#666666] transition-transform duration-300 ${expandedFaq === i ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.2,1,0.3,1)] ${expandedFaq === i ? 'max-h-48 pb-8 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="text-[#666666] leading-relaxed pr-8">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif text-[#111111] mb-6">Tell us what healthcare still gets wrong.</h2>
        <p className="text-lg text-[#666666] mb-12 font-serif italic">Your perspective could shape what gets built next.</p>
        
        <a href="#share" className="inline-flex items-center justify-center gap-2 bg-transparent border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white px-8 py-4 rounded-full font-medium transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sand">
          Tell us what didn&apos;t work <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </section>
    </main>
  );
}
