
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

const EmailPreview = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <div className="mb-6 flex gap-4">
        <Button asChild variant="outline">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
      
      <Card className="w-full max-w-[640px] shadow-lg overflow-hidden border-none">
        {/* O conteúdo abaixo é uma representação fiel do HTML do e-mail */}
        <div style={{ backgroundColor: "#ffffff", padding: "40px 20px" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#f0eee4", borderRadius: "12px", border: "1px solid #EAEAEA", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden" }}>
            
            {/* Faixa superior */}
            <div style={{ display: "flex", height: "6px" }}>
              <div style={{ flex: "1", backgroundColor: "#f5dfbb" }}></div>
              <div style={{ flex: "1", backgroundColor: "#fbce00" }}></div>
              <div style={{ flex: "1", backgroundColor: "#f37964" }}></div>
              <div style={{ flex: "1", backgroundColor: "#81e2cf" }}></div>
              <div style={{ flex: "1", backgroundColor: "#01adff" }}></div>
            </div>

            {/* Cabeçalho */}
            <div style={{ padding: "40px 40px 20px 40px", textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "12px" }}>
                <img 
                  src="/logo.png" 
                  alt="anabrasil" 
                  style={{ width: "32px", height: "32px", borderRadius: "8px", display: "block" }} 
                />
                <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "28px", color: "#1F2322", letterSpacing: "-0.5px", lineHeight: 1 }}>
                  anabrasil
                </span>
              </div>
            </div>

            {/* Conteúdo */}
            <div style={{ padding: "20px 40px 40px 40px", textAlign: "left" }}>
              <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: 700, color: "#1F2322", fontFamily: "Inter, sans-serif" }}>
                Redefinição de senha
              </h2>
              
              <p style={{ margin: "0 0 16px 0", fontSize: "16px", lineHeight: 1.6, color: "#484848", fontFamily: "Inter, sans-serif" }}>
                Olá,
              </p>
              
              <p style={{ margin: "0 0 24px 0", fontSize: "16px", lineHeight: 1.6, color: "#484848", fontFamily: "Inter, sans-serif" }}>
                Recebemos uma solicitação para redefinir a senha da sua conta na <strong style={{ color: "#1F2322" }}>anabrasil</strong>. Clique no botão abaixo para criar uma nova senha com segurança:
              </p>
              
              <div style={{ marginBottom: "32px" }}>
                <div style={{ display: "inline-block", padding: "14px 28px", backgroundColor: "#81e2cf", color: "#1F2322", textDecoration: "none", borderRadius: "6px", fontWeight: 600, fontSize: "16px", fontFamily: "Inter, sans-serif", cursor: "pointer" }}>
                  Redefinir minha senha
                </div>
              </div>
              
              <hr style={{ border: "none", borderTop: "1px solid #dcdad1", margin: "0 0 24px 0" }} />
              
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#8C8C8C", fontFamily: "Inter, sans-serif" }}>
                Se você não solicitou essa alteração, nenhuma ação é necessária e você pode ignorar este e-mail com segurança. Sua senha permanecerá a mesma.
              </p>
            </div>
          </div>

          <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "24px 20px", fontSize: "12px", lineHeight: 1.5, color: "#8C8C8C", fontFamily: "Inter, sans-serif" }}>
            © 2026 anabrasil Design System.<br />
            Este é um e-mail automático, por favor não responda.
          </div>
        </div>
      </Card>
      
      <div className="mt-8 text-sm text-gray-500 max-w-md text-center">
        <p>Esta é uma prévia de como o e-mail será renderizado nos clientes de e-mail dos seus usuários.</p>
      </div>
    </div>
  );
};

export default EmailPreview;
