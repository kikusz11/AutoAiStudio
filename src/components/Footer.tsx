import { Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-surface/50">
      {/* Gradient line on top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                Ai
              </div>
              <span className="text-lg font-bold">
                <span className="gradient-text">AiStudio</span>
                <span className="text-foreground/70">Auto</span>
              </span>
            </div>
            <p className="text-sm text-foreground/50 max-w-xs leading-relaxed">
              AI automatizációs megoldások kisvállalkozásoknak. Spórolj időt és pénzt az intelligens automatizálással.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/80 mb-4 uppercase tracking-wider">
              Navigáció
            </h4>
            <div className="flex flex-col gap-2">
              {["Főoldal", "Szolgáltatások", "Rólunk", "Kapcsolat"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace("ő", "o").replace("á", "a")}`}
                    className="text-sm text-foreground/50 hover:text-primary-light transition-colors"
                  >
                    {item}
                  </a>
                )
              )}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/80 mb-4 uppercase tracking-wider">
              Kapcsolat
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:info@aistudioauto.hu"
                className="flex items-center gap-2 text-sm text-foreground/50 hover:text-primary-light transition-colors"
              >
                <Mail size={14} />
                info@aistudioauto.hu
              </a>
              <div className="flex items-center gap-2 text-sm text-foreground/50">
                <MapPin size={14} />
                Magyarország
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/30">
            © {new Date().getFullYear()} AiStudioAuto. Minden jog fenntartva.
          </p>
          <p className="text-xs text-foreground/30">
            Készítette: Takács Balázs & Mihálovics Krisztián
          </p>
        </div>
      </div>
    </footer>
  );
}
