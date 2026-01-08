
import React, { useEffect, useState } from 'react';
import { X, Shield, Cookie, FileText, Settings, Check, Lock, Globe, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export type ModalType = 'legal' | 'privacy' | 'social' | 'cookies' | 'cookiesPanel' | null;

interface LegalModalsProps {
  activeModal: ModalType;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ activeModal, onClose }) => {
  const { t } = useLanguage();
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
      case 'legal': return t('legal.titles.legal');
      case 'privacy': return t('legal.titles.privacy');
      case 'social': return t('legal.titles.social');
      case 'cookies': return t('legal.titles.cookies');
      case 'cookiesPanel': return t('legal.titles.cookiesPanel');
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
          <div className="space-y-6 text-gray-600 text-sm leading-relaxed text-justify">
            <p>El presente Aviso Legal regula las condiciones generales de acceso y utilización del sitio web accesible en la dirección URL <strong>https://www.rentiaroom.com</strong> (en adelante, el sitio web), que Rentia Investments S.L. pone a disposición de los usuarios de Internet.</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">1. INFORMACIÓN EXHAUSTIVA DEL TITULAR</h3>
            <ul className="space-y-2 mt-2 bg-gray-50 p-4 rounded-lg border border-gray-100 font-mono text-xs md:text-sm">
              <li><strong>Denominación Social:</strong> Rentia Investments S.L.</li>
              <li><strong>Nombre Comercial:</strong> RentiaRoom</li>
              <li><strong>NIF:</strong> B-75995308</li>
              <li><strong>Representante Legal:</strong> Pol Matencio Espinosa (DNI 44996927A)</li>
              <li><strong>Domicilio Social:</strong> C/ Brazal de Álamos, 7, 30130, Beniel, Murcia, España.</li>
              <li><strong>Email de Contacto:</strong> <a href="mailto:info@rentiaroom.com" className="text-rentia-blue hover:underline">info@rentiaroom.com</a></li>
              <li><strong>Actividad:</strong> Intermediación inmobiliaria, servicios de gestión de alquileres y asesoramiento en inversiones.</li>
            </ul>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">2. CONDICIONES DE USO Y RESPONSABILIDAD</h3>
            <p>El acceso al sitio web atribuye la condición de Usuario e implica la aceptación plena y sin reservas de todas y cada una de las disposiciones incluidas en este Aviso Legal. El usuario se compromete a utilizar el sitio web, sus servicios y contenidos de conformidad con la Ley, la moral, las buenas costumbres y el orden público.</p>
            <p>Rentia Investments S.L. se reserva el derecho a modificar, en cualquier momento y sin previo aviso, la configuración y contenidos de la web, así como las presentes condiciones de uso.</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">3. PROPIEDAD INTELECTUAL E INDUSTRIAL</h3>
            <p>Todos los contenidos presentes en esta web (textos, gráficos, fotografías, logotipos, iconos, imágenes, así como el diseño gráfico, código fuente y software) son propiedad exclusiva de Rentia Investments S.L. o de terceros, cuyos derechos reconoce Rentia Investments S.L., y están sujetos a derechos de propiedad intelectual e industrial protegidos por la legislación nacional e internacional.</p>
            <p>Queda estrictamente prohibida cualquier modalidad de explotación, incluyendo la reproducción, distribución, cesión a terceros, comunicación pública y transformación, mediante cualquier tipo de soporte y medio, de las obras antes mencionadas, creaciones y signos distintivos sin autorización previa y expresa de sus respectivos titulares.</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">4. EXCLUSIÓN DE GARANTÍAS</h3>
            <p>Rentia Investments S.L. no garantiza la inexistencia de interrupciones o errores en el acceso a la web o a su contenido, ni que este se encuentre actualizado. Rentia Investments S.L. llevará a cabo, siempre que no concurran causas que lo hagan imposible o de difícil ejecución, y tan pronto tenga noticia de los errores, desconexiones o falta de actualización en los contenidos, todas aquellas labores tendentes a subsanar los errores, restablecer la comunicación y actualizar los contenidos.</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2 uppercase text-red-700">5. CLÁUSULA ESPECÍFICA DE EXENCIÓN DE RESPONSABILIDAD EN INVERSIONES</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r italic">
              <p className="font-bold text-gray-800 mb-2 underline">AVISO PARA INVERSORES Y PROPIETARIOS:</p>
              <p>La información, estudios de mercado, previsiones de rentabilidad y datos financieros presentados en este portal o en cualquier comunicación emitida por Rentia Investments S.L. tienen carácter meramente orientativo y se basan en estimaciones históricas y condiciones actuales del mercado que pueden variar sin previo aviso.</p>
              <p className="mt-2">Rentia Investments S.L. y su representante Pol Matencio Espinosa no garantizan la obtención de rendimientos específicos. Toda inversión inmobiliaria conlleva riesgos inherentes de pérdida de capital, vacancia o variaciones en la normativa legal. El usuario es el único responsable de realizar su propia diligencia debida (Due Diligence) y de la decisión final de compra, venta o delegación de gestión.</p>
            </div>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">6. LEGISLACIÓN APLICABLE</h3>
            <p>Las presentes condiciones se rigen por la legislación española. Para cualquier litigio que pudiera surgir relacionado con el sitio web o la actividad que en él se desarrolla serán competentes los Juzgados de Murcia, Renunciando expresamente el usuario a cualquier otro fuero que pudiera corresponderle.</p>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed text-justify">
            <div className="bg-blue-50 p-4 rounded border border-blue-100 mb-4">
              <p className="font-medium text-rentia-blue">
                De conformidad con el Reglamento (UE) 2016/679 relativo a la protección de datos (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales (LOPDGDD), le informamos detalladamente sobre nuestra política de privacidad.
              </p>
            </div>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">1. RESPONSABLE DEL TRATAMIENTO DE SUS DATOS</h3>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p><strong>Identidad:</strong> Rentia Investments S.L.</p>
              <p><strong>NIF:</strong> B-75995308</p>
              <p><strong>Representante Legal:</strong> Pol Matencio Espinosa</p>
              <p><strong>Dirección:</strong> C/ Brazal de Álamos, 7, 30130, Beniel, Murcia, España.</p>
              <p><strong>Email:</strong> info@rentiaroom.com</p>
            </div>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">2. FINALIDADES DEL TRATAMIENTO</h3>
            <p>Tratamos la información que nos facilitan las personas interesadas con las siguientes finalidades:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Gestión de Usuarios:</strong> Registro y administración de cuentas de propietarios, inquilinos e inversores en nuestra plataforma privada.</li>
              <li><strong>Gestión Comercial:</strong> Tramitación de solicitudes de información sobre servicios de gestión de alquileres y oportunidades de inversión.</li>
              <li><strong>Ejecución Contractual:</strong> Formalización de contratos de mandato de gestión o mediación inmobiliaria.</li>
              <li><strong>Doble Opt-In:</strong> Verificación de la identidad del usuario mediante sistemas de confirmación vía correo electrónico conforme a la LSSI-CE.</li>
              <li><strong>Comunicaciones:</strong> Envío de boletines informativos o alertas de nuevas propiedades disponibles si existe consentimiento previo.</li>
            </ul>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">3. LEGITIMACIÓN</h3>
            <p>La base legal para el tratamiento de sus datos es el <strong>consentimiento del interesado</strong> al marcar las casillas habilitadas o al contactar con nosotros, así como la <strong>ejecución de un contrato</strong> de prestación de servicios.</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">4. DESTINATARIOS DE CESIONES</h3>
            <p>Sus datos podrán ser cedidos a terceros necesarios para la prestación del servicio (entidades bancarias para pagos, notarías, registros oficiales o asesores fiscales), así como en cumplimiento de obligaciones legales ante autoridades públicas.</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">5. DERECHOS DEL INTERESADO</h3>
            <p>Cualquier persona tiene derecho a obtener confirmación sobre si en Rentia Investments S.L. estamos tratando datos personales que les conciernan, o no.</p>
            <p>Las personas interesadas tienen derecho a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acceder a sus datos personales.</li>
              <li>Solicitar la rectificación de los datos inexactos.</li>
              <li>Solicitar su supresión cuando, entre otros motivos, los datos ya no sean necesarios para los fines que fueron recogidos.</li>
              <li>Solicitar la limitación de su tratamiento.</li>
              <li>Oponerse al tratamiento de sus datos.</li>
              <li>Solicitar la portabilidad de los datos.</li>
            </ul>
            <p className="mt-4">Para ejercer estos derechos, puede enviar un correo electrónico a <strong>info@rentiaroom.com</strong> adjuntando copia de su DNI. Asimismo, le informamos que puede dirigir sus reclamaciones ante la Agencia Española de Protección de Datos (www.aepd.es).</p>
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
            <p>{t('legal.cookies.intro')}</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">2. Tipos de cookies utilizadas</h3>
            <p>{t('legal.cookies.types')}</p>

            <h3 className="text-rentia-black font-bold text-base mt-6 border-b border-gray-100 pb-2">3. Revocación y eliminación de cookies</h3>
            <p>{t('legal.cookies.manage')}</p>
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
              {t('legal.panel.intro')}
            </div>

            {/* Technical */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/80">
              <div className="flex-1 pr-4">
                <div className="font-bold text-rentia-black flex items-center gap-2 mb-1">
                  {t('legal.panel.technical')}
                  <span className="text-[10px] bg-gray-600 text-white px-2 py-0.5 rounded uppercase tracking-wider font-bold">{t('legal.panel.mandatory')}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{t('legal.panel.technical_desc')}</p>
              </div>
              <div className="relative inline-flex items-center cursor-not-allowed opacity-60">
                <div className="w-11 h-6 bg-rentia-blue rounded-full"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform translate-x-5 shadow-sm"></div>
              </div>
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-rentia-blue transition-colors shadow-sm">
              <div className="flex-1 pr-4">
                <div className="font-bold text-rentia-black mb-1">{t('legal.panel.analytics')}</div>
                <p className="text-xs text-gray-500 leading-relaxed">{t('legal.panel.analytics_desc')}</p>
              </div>
              <button
                onClick={() => setCookieSettings({ ...cookieSettings, analytics: !cookieSettings.analytics })}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${cookieSettings.analytics ? 'bg-rentia-blue' : 'bg-gray-200'}`}
              >
                <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full shadow-sm ${cookieSettings.analytics ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Marketing */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-rentia-blue transition-colors shadow-sm">
              <div className="flex-1 pr-4">
                <div className="font-bold text-rentia-black mb-1">{t('legal.panel.marketing')}</div>
                <p className="text-xs text-gray-500 leading-relaxed">{t('legal.panel.marketing_desc')}</p>
              </div>
              <button
                onClick={() => setCookieSettings({ ...cookieSettings, marketing: !cookieSettings.marketing })}
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
                <Check className="w-4 h-4 mr-2" /> {t('legal.panel.save')}
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
              {t('common.understood')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
