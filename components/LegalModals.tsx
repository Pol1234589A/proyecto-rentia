
import React, { useEffect, useState } from 'react';
import { X, Shield, Cookie, FileText, Settings, Check, Lock, Globe, ExternalLink } from 'lucide-react';

export type ModalType = 'legal' | 'privacy' | 'social' | 'cookies' | 'cookiesPanel' | null;

interface LegalModalsProps {
  activeModal: ModalType;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ activeModal, onClose }) => {
  const [cookieSettings, setCookieSettings] = useState({
    technical: true,
    analytics: false,
    marketing: false
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeModal]);

  if (!activeModal) return null;

  const getTitle = () => {
    switch (activeModal) {
      case 'legal': return 'Aviso Legal y Condiciones de Uso';
      case 'privacy': return 'Política de Privacidad y Protección de Datos';
      case 'social': return 'Privacidad en Redes Sociales';
      case 'cookies': return 'Política de Cookies';
      case 'cookiesPanel': return 'Configuración de Cookies';
      default: return '';
    }
  };

  const getIcon = () => {
    switch (activeModal) {
      case 'legal': return <FileText className="w-5 h-5 text-rentia-blue" />;
      case 'privacy': return <Lock className="w-5 h-5 text-rentia-blue" />;
      case 'social': return <Globe className="w-5 h-5 text-rentia-blue" />;
      case 'cookies': return <Cookie className="w-5 h-5 text-rentia-blue" />;
      case 'cookiesPanel': return <Settings className="w-5 h-5 text-rentia-blue" />;
      default: return null;
    }
  };

  const renderContent = () => {
    switch (activeModal) {
      case 'legal':
        return (
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed text-justify">
            <p>En cumplimiento con el deber de información recogido en el artículo 10 de la <strong>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE)</strong>, a continuación se reflejan los siguientes datos de información general de este sitio web:</p>
            
            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">1. Datos Identificativos del Responsable</h3>
            <ul className="space-y-2 mt-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <li><strong>Denominación Comercial:</strong> RentiaRoom</li>
                <li><strong>Actividad:</strong> Gestión de inversiones inmobiliarias, intermediación y alquiler de inmuebles por habitaciones.</li>
                <li><strong>Email de contacto:</strong> <a href="mailto:info@rentiaroom.com" className="text-rentia-blue hover:underline">info@rentiaroom.com</a></li>
                <li><strong>Teléfono:</strong> +34 672 88 63 69</li>
                <li><strong>Domicilio:</strong> Murcia, España.</li>
            </ul>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">2. Objeto y Ámbito de Aplicación</h3>
            <p>Las presentes Condiciones Generales de Uso (en adelante, las "Condiciones") tienen por objeto regular el acceso, navegación y uso del sitio web. El acceso a la misma implica la aceptación sin reservas de todas y cada una de las presentes Condiciones. Si el Usuario no está de acuerdo con alguna de las condiciones aquí establecidas, no deberá usar este Sitio Web.</p>
            <p>RentiaRoom se reserva el derecho a modificar la presentación, configuración y contenido del Sitio Web, así como las condiciones requeridas para su acceso y/o utilización.</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">3. Propiedad Intelectual e Industrial</h3>
            <p>RentiaRoom es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (a título enunciativo no limitativo: imágenes, sonido, audio, vídeo, software, textos, marcas o logotipos, combinaciones de colores, estructura y diseño, selección de materiales usados, programas de ordenador necesarios para su funcionamiento, acceso y uso, etc.).</p>
            <p>En virtud de lo dispuesto en los artículos 8 y 32.1, párrafo segundo, de la Ley de Propiedad Intelectual, quedan expresamente prohibidas la reproducción, la distribución y la comunicación pública, incluida su modalidad de puesta a disposición, de la totalidad o parte de los contenidos de esta página web, con fines comerciales, en cualquier soporte y por cualquier medio técnico, sin la autorización previa y por escrito de RentiaRoom.</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">4. Exclusión de Garantías y Responsabilidad</h3>
            <p>RentiaRoom declara que ha adoptado las medidas necesarias que, dentro de sus posibilidades y el estado de la tecnología, permiten el correcto funcionamiento de su sitio web, así como la ausencia de virus y componentes dañinos. Sin embargo, RentiaRoom no puede hacerse responsable de:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>La continuidad y disponibilidad de los contenidos y servicios.</li>
                <li>La ausencia de errores en dichos contenidos ni la corrección de cualquier defecto que pudiera ocurrir.</li>
                <li>La ausencia de virus y/o demás componentes dañinos.</li>
                <li>Los daños o perjuicios que cause cualquier persona que vulnere los sistemas de seguridad de RentiaRoom.</li>
            </ul>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">5. Enlaces a Terceros</h3>
            <p>En el caso de que en el sitio web se dispusiesen enlaces o hipervínculos hacía otros sitios de Internet (como Idealista, redes sociales, etc.), RentiaRoom no ejercerá ningún tipo de control sobre dichos sitios y contenidos. En ningún caso RentiaRoom asumirá responsabilidad alguna por los contenidos de algún enlace perteneciente a un sitio web ajeno.</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">6. Ley Aplicable y Jurisdicción</h3>
            <p>La relación entre RentiaRoom y el Usuario se regirá por la normativa española vigente. Todas las disputas y reclamaciones derivadas de este aviso legal se resolverán por los juzgados y tribunales de la ciudad de <strong>Murcia</strong>, renunciando expresamente a cualquier otro fuero que pudiera corresponderles, salvo que la ley aplicable disponga imperativamente lo contrario.</p>
          </div>
        );
      
      case 'privacy':
        return (
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed text-justify">
             <div className="bg-blue-50 p-4 rounded border border-blue-100 mb-4">
                <p className="font-medium text-rentia-blue">
                    RentiaRoom se compromete al cumplimiento del <strong>Reglamento (UE) 2016/679 (RGPD)</strong> y la <strong>Ley Orgánica 3/2018 de Protección de Datos y garantía de los derechos digitales (LOPDGDD)</strong>.
                </p>
             </div>
             
             <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">1. Responsable del Tratamiento</h3>
             <p>El Responsable del Tratamiento de los datos personales recogidos en este sitio web es <strong>RentiaRoom</strong>.</p>
             <ul className="space-y-1">
                 <li><strong>Domicilio:</strong> Murcia, España.</li>
                 <li><strong>Email de contacto DPD:</strong> <a href="mailto:info@rentiaroom.com" className="hover:underline text-rentia-blue">info@rentiaroom.com</a></li>
             </ul>

             <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">2. Finalidad y Legitimación del Tratamiento</h3>
             <p>Sus datos personales serán tratados con las siguientes finalidades, según la vía de recogida:</p>
             <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 mt-2 text-xs md:text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-2 px-3 border-b text-left">Finalidad</th>
                            <th className="py-2 px-3 border-b text-left">Base de Legitimación</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="py-2 px-3 border-b">Gestión de consultas vía formulario, WhatsApp o email.</td>
                            <td className="py-2 px-3 border-b">Consentimiento del interesado (Art. 6.1.a RGPD).</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 border-b">Gestión de contratos de alquiler y prestación de servicios.</td>
                            <td className="py-2 px-3 border-b">Ejecución de un contrato (Art. 6.1.b RGPD).</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 border-b">Envío de comunicaciones comerciales (Newsletter/Canal).</td>
                            <td className="py-2 px-3 border-b">Consentimiento expreso del interesado.</td>
                        </tr>
                    </tbody>
                </table>
             </div>

             <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">3. Plazo de Conservación</h3>
             <p>Los datos proporcionados se conservarán mientras se mantenga la relación comercial o durante los años necesarios para cumplir con las obligaciones legales (fiscales, contables). Posteriormente, serán bloqueados y eliminados conforme a la normativa.</p>

             <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">4. Destinatarios de los datos</h3>
             <p>Sus datos no serán cedidos a terceros salvo obligación legal. No obstante, para prestar nuestros servicios, compartimos datos con proveedores de servicios (encargados del tratamiento) bajo sus correspondientes condiciones de privacidad:</p>
             <ul className="list-disc pl-5 space-y-1">
                 <li>Google LLC (Analytics, Email).</li>
                 <li>Meta Platforms Inc. (WhatsApp Business).</li>
                 <li>Proveedores de hosting y mantenimiento web.</li>
             </ul>

             <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">5. Derechos del Usuario</h3>
             <p>Usted tiene derecho a obtener confirmación sobre si en RentiaRoom estamos tratando sus datos personales. Puede ejercer sus derechos de:</p>
             <ul className="list-disc pl-5 space-y-1">
                 <li><strong>Acceso:</strong> Consultar qué datos tenemos suyos.</li>
                 <li><strong>Rectificación:</strong> Modificar datos inexactos.</li>
                 <li><strong>Supresión:</strong> Solicitar la eliminación de los datos.</li>
                 <li><strong>Limitación:</strong> Restringir el tratamiento en ciertos casos.</li>
                 <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado.</li>
                 <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos.</li>
             </ul>
             <p className="mt-2">Para ejercer estos derechos, envíe un email a <a href="mailto:info@rentiaroom.com" className="text-rentia-blue hover:underline">info@rentiaroom.com</a> adjuntando copia de su DNI.</p>
          </div>
        );
      
      case 'social':
        return (
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed text-justify">
            <h3 className="text-rentia-black font-bold text-base mt-2 border-b border-gray-100 pb-2">1. Información General</h3>
            <p>RentiaRoom dispone de perfiles en diferentes redes sociales (Facebook, Instagram, TikTok, LinkedIn, WhatsApp Channel) con la finalidad principal de publicitar sus productos y servicios. Al hacerte seguidor o interactuar en nuestros perfiles, aceptas el tratamiento de tus datos personales dentro del entorno de estas plataformas.</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">2. Responsabilidad</h3>
            <p>RentiaRoom es responsable del tratamiento de los datos de sus seguidores, pero no tiene control sobre el funcionamiento de las redes sociales, sus algoritmos o sus políticas de privacidad.</p>
            <p>RentiaRoom podrá utilizar estos perfiles para:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Informar sobre actividades, conferencias o nuevos servicios.</li>
                <li>Publicar oportunidades de inversión.</li>
                <li>Atender consultas a través de mensajes directos.</li>
            </ul>
            <p>En ningún caso extraeremos datos de las redes sociales a menos que se obtuviera puntual y expresamente el consentimiento del usuario para ello.</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">3. Derechos</h3>
            <p>El usuario puede acceder en todo momento a las políticas de privacidad de la propia red social, así como configurar su perfil para garantizar su privacidad. RentiaRoom no puede modificar sus datos en la red social (como su nombre o foto), por lo que el ejercicio de derechos de rectificación deberá realizarlo ante la propia plataforma.</p>
            
            <div className="bg-yellow-50 border-l-4 border-rentia-gold p-3 mt-4 text-xs">
                <p>Recomendamos revisar las condiciones de uso y políticas de privacidad de:</p>
                <ul className="mt-1 list-inside">
                    <li>Meta Platforms (Facebook, Instagram, WhatsApp)</li>
                    <li>LinkedIn Corp.</li>
                    <li>ByteDance (TikTok)</li>
                </ul>
            </div>
          </div>
        );

      case 'cookies':
        return (
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed text-justify">
             <h3 className="text-rentia-black font-bold text-base mt-2 border-b border-gray-100 pb-2">1. ¿Qué son las Cookies?</h3>
             <p>Una cookie es un fichero que se descarga en su ordenador al acceder a determinadas páginas web. Las cookies permiten a una página web, entre otras cosas, almacenar y recuperar información sobre los hábitos de navegación de un usuario o de su equipo y, dependiendo de la información que contengan y de la forma en que utilice su equipo, pueden utilizarse para reconocer al usuario.</p>

             <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">2. Tipos de cookies utilizadas</h3>
             <p>Este sitio web utiliza cookies propias y de terceros:</p>
             
             <div className="overflow-x-auto mt-3">
                 <table className="min-w-full bg-white border border-gray-200 text-xs">
                     <thead className="bg-gray-100">
                         <tr>
                             <th className="py-2 px-2 border-b text-left">Tipo</th>
                             <th className="py-2 px-2 border-b text-left">Finalidad</th>
                             <th className="py-2 px-2 border-b text-left">Titular</th>
                         </tr>
                     </thead>
                     <tbody>
                         <tr>
                             <td className="py-2 px-2 border-b font-semibold">Técnicas</td>
                             <td className="py-2 px-2 border-b">Funcionamiento básico, seguridad y preferencias.</td>
                             <td className="py-2 px-2 border-b">RentiaRoom</td>
                         </tr>
                         <tr>
                             <td className="py-2 px-2 border-b font-semibold">Analíticas</td>
                             <td className="py-2 px-2 border-b">Medición de visitas, fuentes de tráfico y comportamiento.</td>
                             <td className="py-2 px-2 border-b">Google Analytics</td>
                         </tr>
                         <tr>
                             <td className="py-2 px-2 border-b font-semibold">Sociales</td>
                             <td className="py-2 px-2 border-b">Interacción con widgets sociales (WhatsApp, etc).</td>
                             <td className="py-2 px-2 border-b">Meta / Terceros</td>
                         </tr>
                     </tbody>
                 </table>
             </div>

             <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">3. Revocación y eliminación de cookies</h3>
             <p>Puede usted permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones del navegador instalado en su ordenador:</p>
             <ul className="list-disc pl-5 space-y-1 mt-2">
                 <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer" className="text-rentia-blue hover:underline">Google Chrome</a></li>
                 <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noreferrer" className="text-rentia-blue hover:underline">Mozilla Firefox</a></li>
                 <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer" className="text-rentia-blue hover:underline">Safari</a></li>
                 <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noreferrer" className="text-rentia-blue hover:underline">Microsoft Edge</a></li>
             </ul>
             
             <p className="mt-4">También puede modificar sus preferencias de consentimiento en cualquier momento a través de nuestro <strong>Panel de Configuración</strong> accesible en el pie de página.</p>
          </div>
        );

      case 'cookiesPanel':
        return (
           <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-6 border-l-4 border-rentia-blue">
                  Este panel le permite configurar sus preferencias de consentimiento para las tecnologías de seguimiento que utilizamos. Respetamos su privacidad según el RGPD.
              </div>
              
              {/* Technical */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/80">
                 <div className="flex-1 pr-4">
                    <div className="font-bold text-rentia-black flex items-center gap-2 mb-1">
                       Cookies Técnicas 
                       <span className="text-[10px] bg-gray-600 text-white px-2 py-0.5 rounded uppercase tracking-wider font-bold">Obligatorias</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">Necesarias para la navegación y el funcionamiento seguro de la web. No pueden desactivarse.</p>
                 </div>
                 <div className="relative inline-flex items-center cursor-not-allowed opacity-60">
                    <div className="w-11 h-6 bg-rentia-blue rounded-full"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform translate-x-5 shadow-sm"></div>
                 </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-rentia-blue transition-colors shadow-sm">
                 <div className="flex-1 pr-4">
                    <div className="font-bold text-rentia-black mb-1">Cookies Analíticas</div>
                    <p className="text-xs text-gray-500 leading-relaxed">Nos permiten cuantificar el número de usuarios y realizar la medición y análisis estadístico de la utilización que hacen los usuarios del servicio ofertado.</p>
                 </div>
                 <button 
                    onClick={() => setCookieSettings({...cookieSettings, analytics: !cookieSettings.analytics})}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${cookieSettings.analytics ? 'bg-rentia-blue' : 'bg-gray-200'}`}
                 >
                    <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full shadow-sm ${cookieSettings.analytics ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-rentia-blue transition-colors shadow-sm">
                 <div className="flex-1 pr-4">
                    <div className="font-bold text-rentia-black mb-1">Cookies de Marketing</div>
                    <p className="text-xs text-gray-500 leading-relaxed">Utilizadas para rastrear a los visitantes en las páginas web. Permiten gestionar de la forma más eficaz posible la oferta de los espacios publicitarios.</p>
                 </div>
                 <button 
                    onClick={() => setCookieSettings({...cookieSettings, marketing: !cookieSettings.marketing})}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${cookieSettings.marketing ? 'bg-rentia-blue' : 'bg-gray-200'}`}
                 >
                    <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full shadow-sm ${cookieSettings.marketing ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
              </div>
              
              <div className="pt-4 flex justify-end border-t border-gray-100 mt-4">
                 <button 
                    onClick={onClose}
                    className="bg-rentia-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl text-sm flex items-center transform hover:-translate-y-0.5"
                 >
                    <Check className="w-4 h-4 mr-2" /> Guardar Preferencias
                 </button>
              </div>
           </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-rentia-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-rentia-blue rounded-xl border border-blue-100">
                    {getIcon()}
                </div>
                <h2 className="text-lg md:text-xl font-bold text-rentia-black font-display">{getTitle()}</h2>
            </div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-rentia-black transition-colors"
                aria-label="Cerrar"
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {renderContent()}
        </div>
        
        {activeModal !== 'cookiesPanel' && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-rentia-black text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors"
                >
                    Entendido
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
