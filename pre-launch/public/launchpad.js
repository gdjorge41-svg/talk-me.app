
// [v60.Mac] Resolución Unificada de Rutas de Modelos (Ley de Murphy)
let _serverResolvedDefaultPath = '';
function getEffectiveModelsPath() {
    const cached = localStorage.getItem('talkme_models_path');
    if (cached) {
        // Si el valor guardado es C:\TalkMe\Models pero el navegador/app corre en Mac o Linux, descartarlo
        const isAppleOrLinux = /Mac|iPhone|iPad|Linux/i.test(navigator.userAgent || navigator.platform);
        if (isAppleOrLinux && (cached.startsWith('C:\\') || cached.startsWith('C:/'))) {
            if (_serverResolvedDefaultPath) {
                localStorage.setItem('talkme_models_path', _serverResolvedDefaultPath);
                return _serverResolvedDefaultPath;
            }
        } else {
            return cached;
        }
    }
    return _serverResolvedDefaultPath || 'C:\\TalkMe\\Models';
}

async function syncDefaultModelsPathFromServer() {
    try {
        const res = await fetch('/api/default-models-path');
        const data = await res.json();
        if (data && data.success && data.path) {
            _serverResolvedDefaultPath = data.path;
            const current = localStorage.getItem('talkme_models_path');
            const isAppleOrLinux = /Mac|iPhone|iPad|Linux/i.test(navigator.userAgent || navigator.platform);
            if (!current || (isAppleOrLinux && (current.startsWith('C:\\') || current.startsWith('C:/')))) {
                localStorage.setItem('talkme_models_path', data.path);
            }
            const activePath = localStorage.getItem('talkme_models_path') || data.path;
            const inpTab = document.getElementById('inputModelsPath');
            const inpModal = document.getElementById('inputModelsPathModal');
            const inpTrans = document.getElementById('inputTranslateModelsPath');
            if (inpTab) inpTab.value = activePath;
            if (inpModal) inpModal.value = activePath;
            if (inpTrans) inpTrans.value = activePath;
        }
    } catch (e) {
        console.warn('⚠️ [MODELS-PATH] No se pudo consultar /api/default-models-path:', e.message);
    }
}

function extendTranslations() {
    const extra = {
        "es": {
            "msg_rto_cancelled": "La suscripción Rent-to-Own ha sido cancelada.",
            "msg_rto_blocked_3_strikes": "Licencia bloqueada por exceder los 3 strikes de impago. Por favor, conéctese a internet e inicie sesión.",
            "msg_rto_blocked_payment_required": "Licencia bloqueada por falta de pago (período de gracia de 3 días excedido). Por favor, conéctese a internet e inicie sesión.",
            "msg_online_validation_required": "Validación online requerida tras 30 días de la compra. Por favor, inicie sesión con conexión a internet.",
            "msg_perpetual_blocked_contact_support": "Licencia perpetua bloqueada por falta de sincronización online prolongada. Por favor, inicie sesión con conexión a internet.",
            "msg_upgrade_required": "Actualización requerida. Por favor, descargue la última versión.",
            "msg_user_exists": "El usuario ya existe.",
            "msg_invalid_credentials": "Credenciales inválidas.",
            "lbl_no_engines_installed": "Ningún motor instalado",
            "confirm_delete_model": "¿Estás seguro de que deseas eliminar físicamente el modelo '{model}' del disco para liberar espacio?"
        },
        "en": {
            "msg_rto_cancelled": "The Rent-to-Own subscription has been cancelled.",
            "msg_rto_blocked_3_strikes": "License blocked for exceeding 3 payment strikes. Please connect to the internet and log in.",
            "msg_rto_blocked_payment_required": "License blocked due to non-payment (3-day grace period exceeded). Please connect to the internet and log in.",
            "msg_online_validation_required": "Online validation required after 30 days of purchase. Please log in with an internet connection.",
            "msg_perpetual_blocked_contact_support": "Perpetual license blocked due to prolonged lack of online synchronization. Please log in with an internet connection.",
            "msg_upgrade_required": "Upgrade required. Please download the latest version.",
            "msg_user_exists": "The user already exists.",
            "msg_invalid_credentials": "Invalid credentials.",
            "lbl_no_engines_installed": "No engines installed",
            "confirm_delete_model": "Are you sure you want to delete model '{model}' physically from disk?"
        },
        "eu": {
            "msg_rto_cancelled": "Rent-to-Own harpidetza bertan behera utzi da.",
            "msg_rto_blocked_3_strikes": "Lizentzia blokeatuta ordainketarik gabeko 3 strike gainditzeagatik. Mesedez, konektatu internetera eta hasi saioa.",
            "msg_rto_blocked_payment_required": "Lizentzia blokeatuta ordainketarik ezagatik (3 eguneko grazia-epea gaindituta). Mesedez, konektatu internetera eta hasi saioa.",
            "msg_online_validation_required": "Lineako baliozkotzea beharrezkoa da erosi eta 30 egunera. Mesedez, hasi saioa interneteko konexioarekin.",
            "msg_perpetual_blocked_contact_support": "Lizentzia iraunkorra blokeatuta lineako sinkronizazio falta luzeagatik. Mesedez, hasi saioa interneteko konexioarekin.",
            "msg_upgrade_required": "Eguneratzea beharrezkoa da. Mesedez, deskargatu azken bertsioa.",
            "msg_user_exists": "Erabiltzailea dagoeneko badago.",
            "msg_invalid_credentials": "Kredentzial baliogabeak.",
            "lbl_no_engines_installed": "Ez dago motorrik instalatuta",
            "confirm_delete_model": "Ziur zaude '{model}' eredua diskotik fisikoki ezabatu nahi duzula?"
        },
        "ca": {
            "msg_rto_cancelled": "La subscripció Rent-to-Own ha estat cancel·lada.",
            "msg_rto_blocked_3_strikes": "Llicència bloquejada per excedir els 3 strikes d'impagament. Si us plau, connecteu-vos a internet i inicieu sessió.",
            "msg_rto_blocked_payment_required": "Llicència bloquejada per falta de pagament (període de gràcia de 3 dies excedit). Si us plau, connecteu-vos a internet i inicieu sessió.",
            "msg_online_validation_required": "Validació en línia requerida després de 30 dies de la compra. Si us plau, inicieu sessió amb connexió a internet.",
            "msg_perpetual_blocked_contact_support": "Llicència perpètua bloquejada per falta de sincronització en línia prolongada. Si us plau, inicieu sessió amb connexió a internet.",
            "msg_upgrade_required": "Actualització requerida. Si us plau, descarregueu la darrera versió.",
            "msg_user_exists": "L'usuari ja existeix.",
            "msg_invalid_credentials": "Credencials invàlides.",
            "lbl_no_engines_installed": "Cap motor instal·lat",
            "confirm_delete_model": "Estàs segur que vols eliminar físicament el model '{model}' del disc?"
        },
        "gl": {
            "msg_rto_cancelled": "A subscrición Rent-to-Own foi cancelada.",
            "msg_rto_blocked_3_strikes": "Licenza bloqueada por superar os 3 strikes de falta de pagamento. Por favor, conéctese a internet e inicie sesión.",
            "msg_rto_blocked_payment_required": "Licenza bloqueada por falta de pagamento (período de graza de 3 días superado). Por favor, conéctese a internet e inicie sesión.",
            "msg_online_validation_required": "Validación en liña requirida despois de 30 días da compra. Por favor, inicie sesión con conexión a internet.",
            "msg_perpetual_blocked_contact_support": "Licenza perpetua bloqueada por falta de sincronización en liña prolongada. Por favor, inicie sesión con conexión a internet.",
            "msg_upgrade_required": "Actualización requirida. Por favor, descargue a última versión.",
            "msg_user_exists": "O usuario xa existe.",
            "msg_invalid_credentials": "Credenciais inválidas.",
            "lbl_no_engines_installed": "Ningún motor instalado",
            "confirm_delete_model": "¿Estás seguro de que queres eliminar fisicamente o modelo '{model}' do disco?"
        },
        "de": {
            "msg_rto_cancelled": "Das Rent-to-Own-Abonnement wurde gekündigt.",
            "msg_rto_blocked_3_strikes": "Lizenz gesperrt wegen Überschreitung von 3 Zahlungsausfällen. Bitte verbinden Sie sich mit dem Internet und melden Sie sich an.",
            "msg_rto_blocked_payment_required": "Lizenz wegen Nichtzahlung gesperrt (3-tägige Nachfrist überschritten). Bitte verbinden Sie sich mit dem Internet und melden Sie sich an.",
            "msg_online_validation_required": "Online-Validierung nach 30 Tagen ab Kauf erforderlich. Bitte melden Sie sich mit einer Internetverbindung an.",
            "msg_perpetual_blocked_contact_support": "Dauerhafte Lizenz wegen längerer fehlender Online-Synchronisierung gesperrt. Bitte melden Sie sich mit einer Internetverbindung an.",
            "msg_upgrade_required": "Upgrade erforderlich. Bitte laden Sie die neueste Version herunter.",
            "msg_user_exists": "Der Benutzer existiert bereits.",
            "msg_invalid_credentials": "Ungültige Anmeldedaten.",
            "lbl_no_engines_installed": "Keine Motoren installiert",
            "confirm_delete_model": "Sind Sie sicher, dass Sie das Modell '{model}' physisch von der Festplatte löschen möchten?"
        },
        "fr": {
            "msg_rto_cancelled": "L'abonnement Rent-to-Own a été annulé.",
            "msg_rto_blocked_3_strikes": "Licence bloquée pour avoir dépassé 3 strikes de non-paiement. Veuillez vous connecter à Internet et vous connecter.",
            "msg_rto_blocked_payment_required": "Licence bloquée pour non-paiement (période de grâce de 3 jours dépassée). Veuillez vous connecter à Internet et vous connecter.",
            "msg_online_validation_required": "Validation en ligne requise après 30 jours d'achat. Veuillez vous connecter avec une connexion Internet.",
            "msg_perpetual_blocked_contact_support": "Licence perpétuelle bloquée en raison d'un manque prolongé de synchronisation en ligne. Veuillez vous connecter avec une connexion Internet.",
            "msg_upgrade_required": "Mise à niveau requise. Veuillez télécharger la dernière version.",
            "msg_user_exists": "L'utilisateur existe déjà.",
            "msg_invalid_credentials": "Identifiants invalides.",
            "lbl_no_engines_installed": "Aucun moteur installé",
            "confirm_delete_model": "Êtes-vous sûr de vouloir supprimer physiquement le modèle '{model}' du disque ?"
        },
        "it": {
            "msg_rto_cancelled": "L'abbonamento Rent-to-Own è stato annullato.",
            "msg_rto_blocked_3_strikes": "Licenza bloccata per aver superato i 3 strikes di mancato pagamento. Si prega di connettersi a Internet e accedere.",
            "msg_rto_blocked_payment_required": "Licenza bloccata per mancato pagamento (periodo di grazia di 3 giorni superato). Si prega di connettersi a Internet e accedere.",
            "msg_online_validation_required": "Validazione online richiesta dopo 30 giorni dall'acquisto. Si prega di accedere con una connessione Internet.",
            "msg_perpetual_blocked_contact_support": "Licenza perpetua bloccata per prolungata mancanza di sincronizzazione online. Si prega di accedere con una connessione Internet.",
            "msg_upgrade_required": "Aggiornamento richiesto. Si prega di scaricare l'ultima versione.",
            "msg_user_exists": "L'utente esiste già.",
            "msg_invalid_credentials": "Credenziali non valide.",
            "lbl_no_engines_installed": "Nessun motore installato",
            "confirm_delete_model": "Sei sicuro di voler eliminare fisicamente il modello '{model}' dal disco?"
        },
        "pt": {
            "msg_rto_cancelled": "A assinatura Rent-to-Own foi cancelada.",
            "msg_rto_blocked_3_strikes": "Licença bloqueada por exceder os 3 strikes de não pagamento. Por favor, conecte-se à internet e faça login.",
            "msg_rto_blocked_payment_required": "Licença bloqueada por falta de pagamento (período de carência de 3 dias excedido). Por favor, conecte-se à internet e faça login.",
            "msg_online_validation_required": "Validação online necessária após 30 dias da compra. Por favor, faça login com uma conexão à internet.",
            "msg_perpetual_blocked_contact_support": "Licença perpétua bloqueada por falta prolongada de sincronização online. Por favor, faça login com uma conexão à internet.",
            "msg_upgrade_required": "Atualização necessária. Por favor, baixe a versão mais recente.",
            "msg_user_exists": "O usuário já existe.",
            "msg_invalid_credentials": "Credenciais inválidas.",
            "lbl_no_engines_installed": "Nenhum motor instalado",
            "confirm_delete_model": "Tem certeza de que deseja excluir fisicamente o modelo '{model}' do disco?"
        },
        "nl": {
            "msg_rto_cancelled": "Het Rent-to-Own-abonnement is geannuleerd.",
            "msg_rto_blocked_3_strikes": "Licentie geblokkeerd vanwege het overschrijden van 3 betalingsstrikes. Maak verbinding met internet en log in.",
            "msg_rto_blocked_payment_required": "Licentie geblokkeerd wegens wanbetaling (gratieperiode van 3 dagen overschreden). Maak verbinding met internet en log in.",
            "msg_online_validation_required": "Online validatie vereist na 30 dagen na aankoop. Log in met een internetverbinding.",
            "msg_perpetual_blocked_contact_support": "Permanente licentie geblokkeerd wegens langdurig gebrek aan online synchronisatie. Log in met een internetverbinding.",
            "msg_upgrade_required": "Upgrade vereist. Download de nieuwste versie.",
            "msg_user_exists": "De gebruiker bestaat al.",
            "msg_invalid_credentials": "Ongeldige inloggegevens.",
            "lbl_no_engines_installed": "Geen motoren geïnstalleerd",
            "confirm_delete_model": "Weet u zeker dat u model '{model}' fysiek van de schijf wilt verwijderen?"
        },
        "ar": {
            "msg_rto_cancelled": "تم إلغاء اشتراك Rent-to-Own.",
            "msg_rto_blocked_3_strikes": "تم حظر الترخيص لتجاوز 3 إنذارات عدم دفع. يرجى الاتصال بالإنترنت وتسجيل الدخول.",
            "msg_rto_blocked_payment_required": "تم حظر الترخيص بسبب عدم الدفع (تجاوز فترة السماح 3 أيام). يرجى الاتصال بالإنترنت وتسجيل الدخول.",
            "msg_online_validation_required": "مطلوب التحقق عبر الإنترنت بعد 30 يومًا من الشراء. يرجى تسجيل الدخول مع اتصال بالإنترنت.",
            "msg_perpetual_blocked_contact_support": "تم حظر الترخيص الدائم بسبب عدم المزامنة عبر الإنترنت لفترة طويلة. يرجى تسجيل الدخول مع اتصال بالإنترنت.",
            "msg_upgrade_required": "التحديث مطلوب. يرجى تنزيل أحدث إصدار.",
            "msg_user_exists": "المستخدم موجود بالفعل.",
            "msg_invalid_credentials": "بيانات اعتماد غير صالحة.",
            "lbl_no_engines_installed": "لم يتم تثبيت أي محرك",
            "confirm_delete_model": "هل أنت متأكد من أنك تريد حذف النموذج '{model}' فعليًا من القرص؟"
        },
        "zh": {
            "msg_rto_cancelled": "Rent-to-Own 订阅已取消。",
            "msg_rto_blocked_3_strikes": "因超过3次未付款而被锁定许可证。请连接到互联网并登录。",
            "msg_rto_blocked_payment_required": "因未付款而被锁定许可证（超过3天宽限期）。请连接到互联网并登录。",
            "msg_online_validation_required": "购买30天后需要在线验证。请在有互联网连接的情况下登录。",
            "msg_perpetual_blocked_contact_support": "因长期未进行在线同步而锁定永久许可证。请在有互联网连接的情况下登录。",
            "msg_upgrade_required": "需要升级。请下载最新版本。",
            "msg_user_exists": "用户已存在。",
            "msg_invalid_credentials": "无效的凭据。",
            "lbl_no_engines_installed": "未安装 any 引擎",
            "confirm_delete_model": "您确定要从磁盘物理删除模型 '{model}' 吗？"
        },
        "ja": {
            "msg_rto_cancelled": "Rent-to-Own サブスクリプションがキャンセルされました。",
            "msg_rto_blocked_3_strikes": "未払いが3回を超えたためライセンスがブロックされました。インターネットに接続してログインしてください。",
            "msg_rto_blocked_payment_required": "未払いのためライセンスがブロックされました（3日間の猶予期間超過）。インターネットに接続してログインしてください。",
            "msg_online_validation_required": "購入から30日後にオンライン検証が必要です。インターネット接続環境でログインしてください。",
            "msg_perpetual_blocked_contact_support": "長期間オンライン同期が行われなかったため永久ライセンスがブロックされました。インターネット接続環境でログインしてください。",
            "msg_upgrade_required": "アップグレードが必要です。最新バージョンをダウンロードしてください。",
            "msg_user_exists": "ユーザーはすでに存在します。",
            "msg_invalid_credentials": "資格情報が無効です。",
            "lbl_no_engines_installed": "エンジンがインストールされていません",
            "confirm_delete_model": "モデル '{model}' をディスクから物理的に削除してもよろしいですか？"
        },
        "ko": {
            "msg_rto_cancelled": "Rent-to-Own 구독이 취소되었습니다.",
            "msg_rto_blocked_3_strikes": "미납이 3회를 초과하여 라이선스가 차단되었습니다. 인터넷에 연결하고 로그인하십시오.",
            "msg_rto_blocked_payment_required": "미납으로 인해 라이선스가 차단되었습니다(3일 유예 기간 초과). 인터넷에 연결하고 로그인하십시오.",
            "msg_online_validation_required": "구매 후 30일이 지나면 온라인 인증이 필요합니다. 인터넷에 연결된 상태에서 로그인하십시오.",
            "msg_perpetual_blocked_contact_support": "장기간 온라인 동기화가 되지 않아 영구 라이선스가 차단되었습니다. 인터넷에 연결된 상태에서 로그인하십시오.",
            "msg_upgrade_required": "업그레이드가 필요합니다. 최신 버전을 다운로드하십시오.",
            "msg_user_exists": "사용자가 이미 존재합니다.",
            "msg_invalid_credentials": "자격 증명이 유효하지 않습니다.",
            "lbl_no_engines_installed": "설치된 엔진이 없습니다",
            "confirm_delete_model": "디스크에서 '{model}' 모델을 물리적으로 삭제하시겠습니까?"
        },
        "ru": {
            "msg_rto_cancelled": "Подписка Rent-to-Own была отменена.",
            "msg_rto_blocked_3_strikes": "Лицензия заблокирована из-за превышения 3 страйков неплатежа. Пожалуйста, подключитесь к интернету и войдите в систему.",
            "msg_rto_blocked_payment_required": "Лицензия заблокирована из-за неуплаты (3-дневный льготный период истек). Пожалуйста, подключитесь к интернету и войдите в систему.",
            "msg_online_validation_required": "Требуется онлайн-подтверждение через 30 дней после покупки. Пожалуйста, войдите в систему при наличии подключения к интернету.",
            "msg_perpetual_blocked_contact_support": "Постоянная лицензия заблокирована из-за длительного отсутствия онлайн-синхронизации. Пожалуйста, войдите в систему при наличии подключения к интернету.",
            "msg_upgrade_required": "Требуется обновление. Пожалуйста, скачайте последнюю версию.",
            "msg_user_exists": "Пользователь уже существует.",
            "msg_invalid_credentials": "Неверные учетные данные.",
            "lbl_no_engines_installed": "Нет установленных движков",
            "confirm_delete_model": "Вы уверены, что хотите физически удалить модель '{model}' с диска?"
        },
        "pl": {
            "msg_rto_cancelled": "Subskrypcja Rent-to-Own została anulowana.",
            "msg_rto_blocked_3_strikes": "Licencja zablokowana z powodu przekroczenia 3 strajków braku płatności. Połącz się z internetem i zaloguj się.",
            "msg_rto_blocked_payment_required": "Licencja zablokowana z powodu braku płatności (przekroczono 3-dniowy okres karencji). Połącz się z internetem i zaloguj się.",
            "msg_online_validation_required": "Wymagana walidacja online po 30 dniach od zakupu. Zaloguj się przy aktywnym połączeniu z internetem.",
            "msg_perpetual_blocked_contact_support": "Licencja stała zablokowana z powodu długotrwałego braku synchronizacji online. Zaloguj się przy aktywnym połączeniu z internetem.",
            "msg_upgrade_required": "Wymagana aktualizacja. Pobierz najnowszą wersję.",
            "msg_user_exists": "Użytkownik już istnieje.",
            "msg_invalid_credentials": "Nieprawidłowe dane uwierzytelniające.",
            "lbl_no_engines_installed": "Brak zainstalowanych silników",
            "confirm_delete_model": "Czy na pewno chcesz fizycznie usunąć model '{model}' z dysku?"
        },
        "tr": {
            "msg_rto_cancelled": "Rent-to-Own aboneliği iptal edildi.",
            "msg_rto_blocked_3_strikes": "Ödenmeyen 3 strike aşımı nedeniyle lisans bloke edildi. Lütfen internete bağlanın ve giriş yapın.",
            "msg_rto_blocked_payment_required": "Ödeme yapılmaması nedeniyle lisans bloke edildi (3 günlük ek süre aşıldı). Lütfen internete bağlanın ve giriş yapın.",
            "msg_online_validation_required": "Satın alma tarihinden 30 gün sonra çevrimiçi doğrulama gereklidir. Lütfen internet bağlantısı ile giriş yapın.",
            "msg_perpetual_blocked_contact_support": "Uzun süre çevrimiçi senkronizasyon yapılmaması nedeniyle kalıcı lisans bloke edildi. Lütfen internet bağlantısı ile giriş yapın.",
            "msg_upgrade_required": "Güncelleme gerekli. Lütfen en son sürümü indirin.",
            "msg_user_exists": "Kullanıcı zaten mevcut.",
            "msg_invalid_credentials": "Geçersiz kimlik bilgileri.",
            "lbl_no_engines_installed": "Hiçbir motor kurulu değil",
            "confirm_delete_model": "'{model}' modelini diskten fiziksel olarak silmek istediğinizden emin misiniz?"
        },
        "sv": {
            "msg_rto_cancelled": "Rent-to-Own-abonnemanget har avbrutits.",
            "msg_rto_blocked_3_strikes": "Licensen blockerad för att ha överskridit 3 obetalda strikes. Anslut till internet och logga in.",
            "msg_rto_blocked_payment_required": "Licensen blockerad på grund av utebliven betalning (3 dagars respitperiod överskriden). Anslut till internet och logga in.",
            "msg_online_validation_required": "Online-validering krävs 30 dagar efter köp. Logga in med internetanslutning.",
            "msg_perpetual_blocked_contact_support": "Permanent licens blockerad på grund av långvarig avsaknad av onlinesynkronisering. Logga in med internetanslutning.",
            "msg_upgrade_required": "Uppgradering krävs. Ladda ner den senaste versionen.",
            "msg_user_exists": "Användaren finns redan.",
            "msg_invalid_credentials": "Ogiltiga uppgifter.",
            "lbl_no_engines_installed": "Inga motorer installerade",
            "confirm_delete_model": "Är du säker på att du vill ta bort modellen '{model}' fysiskt från disken?"
        },
        "uk": {
            "msg_rto_cancelled": "Передплату Rent-to-Own скасовано.",
            "msg_rto_blocked_3_strikes": "Ліцензію заблоковано через перевищення 3 страйків несплати. Будь ласка, підключіться до інтернету та увійдіть.",
            "msg_rto_blocked_payment_required": "Ліцензію заблоковано через несплату (3-денний пільговий період перевищено). Будь ласка, підключіться до інтернету та увійдіть.",
            "msg_online_validation_required": "Потрібна онлайн-валідація через 30 днів після покупки. Будь ласка, увійдіть з підключенням до інтернету.",
            "msg_perpetual_blocked_contact_support": "Постійну ліцензію заблоковано через тривалу відсутність онлайн-синхронізації. Будь ласка, увійдіть з підключенням до інтернету.",
            "msg_upgrade_required": "Потрібно оновити версію. Будь ласка, завантажте останню версію.",
            "msg_user_exists": "Користувач вже існує.",
            "msg_invalid_credentials": "Недійсні облікові дані.",
            "lbl_no_engines_installed": "Не встановлено жодного двигуна",
            "confirm_delete_model": "Ви впевнені, що хочете фізично видалити модель '{model}' з диска?"
        },
        "vi": {
            "msg_rto_cancelled": "Đăng ký Rent-to-Own đã bị hủy.",
            "msg_rto_blocked_3_strikes": "Giấy phép bị khóa do quá 3 lần trễ hạn thanh toán. Vui lòng kết nối internet và đăng nhập.",
            "msg_rto_blocked_payment_required": "Giấy phép bị khóa do không thanh toán (quá thời hạn gia hạn 3 ngày). Vui lòng kết nối internet và đăng nhập.",
            "msg_online_validation_required": "Yêu cầu xác thực trực tuyến sau 30 ngày kể từ ngày mua. Vui lòng đăng nhập khi có kết nối internet.",
            "msg_perpetual_blocked_contact_support": "Giấy phép vĩnh viễn bị khóa do lâu ngày không đồng bộ trực tuyến. Vui lòng đăng nhập khi có kết nối internet.",
            "msg_upgrade_required": "Yêu cầu nâng cấp. Vui lòng tải xuống phiên bản mới nhất.",
            "msg_user_exists": "Người dùng đã tồn tại.",
            "msg_invalid_credentials": "Thông tin xác thực không hợp lệ.",
            "lbl_no_engines_installed": "Không có động cơ nào được cài đặt",
            "confirm_delete_model": "Bạn có chắc chắn muốn xóa vật lý mô hình '{model}' khỏi đĩa không?"
        },
        "fa": {
            "msg_rto_cancelled": "اشتراک Rent-to-Own لغو شده است.",
            "msg_rto_blocked_3_strikes": "مجوز به دلیل بیش از ۳ اخطار پرداخت مسدود شده است. لطفا به اینترنت متصل شوید و وارد شوید.",
            "msg_rto_blocked_payment_required": "مجوز به دلیل عدم پرداخت مسدود شده است (مهلت ۳ روزه پایان یافته). لطفا به اینترنت متصل شوید و وارد شوید.",
            "msg_online_validation_required": "تایید آنلاین پس از ۳۰ روز از خرید الزامی است. لطفا با اتصال به اینترنت وارد شوید.",
            "msg_perpetual_blocked_contact_support": "مجوز دائمی به دلیل عدم همگام‌سازی آنلاین طولانی‌مدت مسدود شده است. لطفا با اتصال به اینترنت وارد شوید.",
            "msg_upgrade_required": "ارتقا الزامی است. لطفا آخرین نسخه را دانلود کنید.",
            "msg_user_exists": "کاربر از قبل وجود دارد.",
            "msg_invalid_credentials": "اعتبارنامه نامعتبر است.",
            "lbl_no_engines_installed": "هیچ موتوری نصب نشده است",
            "confirm_delete_model": "آیا مطمئن هستید که می‌خواهید مدل '{model}' را فیزیکی از دیسک حذف کنید؟"
        },
        "eo": {
            "msg_rto_cancelled": "La abono Rent-to-Own estas nuligita.",
            "msg_rto_blocked_3_strikes": "Permesilo blokita pro supero de 3 nepago-strikoj. Bonvolu konektiĝi al interreto kaj ensaluti.",
            "msg_rto_blocked_payment_required": "Permesilo blokita pro nepago (3-taga indulgoperiodo superita). Bonvolu konektiĝi al interreto kaj ensaluti.",
            "msg_online_validation_required": "Reta validigo postulata post 30 tagoj de la aĉeto. Bonvolu ensaluti kun interreta konekto.",
            "msg_perpetual_blocked_contact_support": "Konstanta permesilo blokita pro longedaŭra manko de reta sinkronigo. Bonvolu ensaluti kun interreta konekto.",
            "msg_upgrade_required": "Ĝisdatigo postulata. Bonvolu elŝuti la plej novan version.",
            "msg_user_exists": "La uzanto jam ekzistas.",
            "msg_invalid_credentials": "Nevalidaj akreditaĵoj.",
            "lbl_no_engines_installed": "Neniu motoro instalita",
            "confirm_delete_model": "Ĉu vi certas, ke vi volas fizike forigi la modelon '{model}' de la disko?"
        },
        "kk": {
            "msg_rto_cancelled": "Rent-to-Own жазылымы тоқтатылды.",
            "msg_rto_blocked_3_strikes": "Төлем жасамағаны үшін 3 ескертуден асқандықтан лицензия бұғатталды. Интернетке қосылып, жүйеге кіріңіз.",
            "msg_rto_blocked_payment_required": "Төлемегендіктен лицензия бұғатталды (3 күндік жеңілдік кезеңі асып кетті). Интернетке қосылып, жүйеге кіріңіз.",
            "msg_online_validation_required": "Сатып алғаннан кейін 30 күн өткен соң онлайн тексеру қажет. Интернет қосылымы арқылы жүйеге кіріңіз.",
            "msg_perpetual_blocked_contact_support": "Ұзақ уақыт бойы онлайн синхрондаудың болмауына байланысты тұрақты лицензия бұғатталды. Интернет қосылымы арқылы жүйеге кіріңіз.",
            "msg_upgrade_required": "Жаңарту қажет. Соңғы нұсқаны жүктеп алыңыз.",
            "msg_user_exists": "Пайдаланушы бұрыннан бар.",
            "msg_invalid_credentials": "Жарамсыз деректер.",
            "lbl_no_engines_installed": "Орнатылған қозғалтқыштар жоқ",
            "confirm_delete_model": "'{model}' моделін дискіден біржола жойғыңыз келе ме?"
        },
        "uz": {
            "msg_rto_cancelled": "Rent-to-Own obunasi bekor qilindi.",
            "msg_rto_blocked_3_strikes": "To'lov qilinmaganligi uchun 3 ta strike oshib ketganligi sababli litsenziya bloklandi. Internetga ulaning va tizimga kiring.",
            "msg_rto_blocked_payment_required": "To'lov qilinmaganligi sababli litsenziya bloklandi (3 kunlik imtiyozli davr tugadi). Internetga ulaning va tizimga kiring.",
            "msg_online_validation_required": "Sotib olingandan keyin 30 kun o'tgach onlayn tasdiqlash talab etiladi. Internetga ulangan holda tizimga kiring.",
            "msg_perpetual_blocked_contact_support": "Uzoq vaqt davomida onlayn sinxronizatsiya qilinmaganligi sababli doimiy litsenziya bloklandi. Internetga ulangan holda tizimga kiring.",
            "msg_upgrade_required": "Yangilash talab etiladi. Oxirgi versiyani yuklab oling.",
            "msg_user_exists": "Foydalanuvchi allaqachon mavjud.",
            "msg_invalid_credentials": "Noto'g'ri hisob ma'lumotlari.",
            "lbl_no_engines_installed": "O'rnatilgan dvigatellar yo'q",
            "confirm_delete_model": "'{model}' modelini diskdan jismonan o'chirishni xohlaysizmi?"
        }
    };
    for (const lang in extra) {
        if (translations[lang]) {
            Object.assign(translations[lang], extra[lang]);
        }
    }
}
extendTranslations();

function getLocalizedApiError(errorText, errorCode) {
    if (errorCode) {
        let key = 'msg_' + errorCode.toLowerCase();
        if (key === 'msg_license_expired') key = 'msg_expired';
        if (key === 'msg_device_limit_reached') {
            const limitMatch = (errorText || '').match(/\((\d+)\)/);
            const limit = limitMatch ? limitMatch[1] : "1";
            const template = (translations[currentLang] && translations[currentLang].msg_device_limit_reached) || (translations['es'] && translations['es'].msg_device_limit_reached) || errorText;
            return template.replace('{limit}', limit);
        }
        if (translations[currentLang] && translations[currentLang][key]) {
            return translations[currentLang][key];
        }
    }
    if (errorText) {
        const lowerText = errorText.toLowerCase();
        if (lowerText.includes("ya está vinculado a otra licencia") || lowerText.includes("vinculado a otra licencia")) {
            const linkedAlerts = {
                es: "ALERTA: Este servidor ya está vinculado a otra licencia de pago activa.",
                en: "ALERT: This server is already linked to another active paid license.",
                ca: "ALERTA: Aquest servidor ja està vinculat a una altra llicència de pagament activa.",
                eu: "ADI: Zerbitzari hau lehendik dagozkion ordaindutako beste lizentzia aktibo bati lotuta dago.",
                gl: "ALERTA: Este servidor xa está vinculado a outra licenza de pago activa.",
                fr: "ALERTE: Ce serveur est déjà lié à une autre licence payante active.",
                de: "WARNUNG: Dieser Server ist bereits mit einer anderen aktiven kostenpflichtigen Lizenz verknüpft.",
                it: "ALLERTA: Questo server è già collegato a un'altra licenza a pagamento attiva.",
                pt: "ALERTA: Este servidor já está vinculado a outra licença de pagamento activa.",
                nl: "WAARSCHUWING: Deze server is al gekoppeld aan een andere actieve betaalde licentie.",
                pl: "OSTRZEŻENIE: Ten serwer jest już powiązany z inną aktywną płatną licencją.",
                ru: "ПРЕДУПРЕЖДЕНИЕ: Этот servidor уже привязан к другой активной платной лицензии.",
                uk: "ПОПЕРЕДЖЕННЯ: Цей сервер вже прив'язаний до іншої активної платної ліцензії.",
                ar: "تنبيه: هذا الخادم مرتبط بالفعل بترخيص مدفوع نشط آخر.",
                zh: "警告：此服务器已绑定 to 另一个处于活动状态的付费许可证。",
                ja: "警告: このサーバーはすでに別の有効な有料ライセンスにリンクされています。",
                ko: "경고: 이 서버는 이미 다른 활성 유료 라이선스에 연결되어 있습니다.",
                tr: "UYARI: Bu sunucu zaten başka bir aktif ücretli lisansla ilişkilendirilmiştir.",
                sv: "VARNING: Denna server är redan kopplad till en annan aktiv betald licens.",
                vi: "CẢNH BÁO: Máy chủ này đã được liên kết với một giấy phép thanh toán hoạt động khác.",
                eo: "AVERTO: Ĉi tiu servilo jam estas ligita al alia aktiva pagita permesilo.",
                fa: "هشدار: این سرور از قبل به مجوز پرداخت فعال دیگری متصل شده است.",
                kk: "ЕСКЕРТУ: Бұл сервер басқа белсенді ақылы лицензиямен байланыстырылған.",
                uz: "OGOHLANTIRISH: Ushbu server allaqachon boshqa faol pullik litsenziyaga bog'langan."
            };
            return linkedAlerts[currentLang] || linkedAlerts['en'] || errorText;
        }
        if (lowerText.includes("ya ha consumido su período de prueba gratuito") || lowerText.includes("ya ha consumido su periodo de prueba gratuito")) {
            return translations[currentLang].msg_trial_already_used || errorText;
        }
        if (lowerText.includes("límite de terminales autorizados") || lowerText.includes("límite de servidores autorizados") || errorCode === "DEVICE_LIMIT_REACHED") {
            const limitMatch = errorText.match(/\((\d+)\)/);
            const limit = limitMatch ? limitMatch[1] : "1";
            const template = (translations[currentLang] && translations[currentLang].msg_device_limit_reached) || translations['es'].msg_device_limit_reached;
            return template.replace('{limit}', limit);
        }
        if (lowerText.includes("la licencia ha expirado") || lowerText.includes("ha expirado")) {
            return translations[currentLang].msg_expired || errorText;
        }
        if (lowerText.includes("la suscripción rent-to-own ha sido cancelada") || lowerText.includes("rent-to-own ha sido cancelada")) {
            return translations[currentLang].msg_rto_cancelled || errorText;
        }
        if (lowerText.includes("cuota mensual rent-to-own ha vencido") || lowerText.includes("regulariza la cuota")) {
            return translations[currentLang].msg_rto_payment_required || errorText;
        }
        if (lowerText.includes("exceder los 3 strikes de impago")) {
            return translations[currentLang].msg_rto_blocked_3_strikes || errorText;
        }
        if (lowerText.includes("falta de pago (período de gracia") || lowerText.includes("período de gracia de 3 días excedido")) {
            return translations[currentLang].msg_rto_blocked_payment_required || errorText;
        }
        if (lowerText.includes("validación online requerida tras 30 días")) {
            return translations[currentLang].msg_online_validation_required || errorText;
        }
        if (lowerText.includes("sincronización online prolongada") || lowerText.includes("falta de sincronización online")) {
            return translations[currentLang].msg_perpetual_blocked_contact_support || errorText;
        }
        if (lowerText === "el usuario ya existe") {
            return translations[currentLang].msg_user_exists || errorText;
        }
        if (lowerText === "credenciales inválidas") {
            return translations[currentLang].msg_invalid_credentials || errorText;
        }
    }
    return errorText;
}

let currentUser = null;
let currentLicenseKey = null;
let currentLang = 'es';
let lastModelsData = {};

function formatExpiryDate(rawDateStr, lang) {
    if (!rawDateStr) return '';
    const d = new Date(rawDateStr);
    if (isNaN(d.getTime())) return rawDateStr;
    try {
        const formatter = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' });
        return formatter.format(d);
    } catch (e) {
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }
}

function formatCurrency(amountEur, lang) {
    const currencyMap = {
        es: { symbol: '€', rate: 1.0, position: 'right', decimals: 2 },
        eu: { symbol: '€', rate: 1.0, position: 'right', decimals: 2 },
        ca: { symbol: '€', rate: 1.0, position: 'right', decimals: 2 },
        gl: { symbol: '€', rate: 1.0, position: 'right', decimals: 2 },
        fr: { symbol: '€', rate: 1.0, position: 'right', decimals: 2 },
        de: { symbol: '€', rate: 1.0, position: 'right', decimals: 2 },
        it: { symbol: '€', rate: 1.0, position: 'right', decimals: 2 },
        nl: { symbol: '€', rate: 1.0, position: 'right', decimals: 2 },
        pt: { symbol: '€', rate: 1.0, position: 'right', decimals: 2 },
        eo: { symbol: '€', rate: 1.0, position: 'right', decimals: 2 },
        en: { symbol: '$', rate: 1.1, position: 'left', decimals: 2 },
        ko: { symbol: '₩', rate: 1500, position: 'left', decimals: 0 },
        ja: { symbol: '¥', rate: 170, position: 'left', decimals: 0 },
        zh: { symbol: '¥', rate: 8.0, position: 'left', decimals: 2 },
        ru: { symbol: '₽', rate: 100, position: 'right', decimals: 0 },
        uk: { symbol: '₴', rate: 43, position: 'right', decimals: 0 },
        kk: { symbol: '₸', rate: 480, position: 'right', decimals: 0 },
        pl: { symbol: ' zł', rate: 4.3, position: 'right', decimals: 2 },
        sv: { symbol: ' kr', rate: 11.5, position: 'right', decimals: 2 },
        tr: { symbol: '₺', rate: 35, position: 'left', decimals: 0 },
        ar: { symbol: ' د.إ', rate: 4.0, position: 'right', decimals: 2 },
        fa: { symbol: '$', rate: 1.1, position: 'left', decimals: 2 },
        uz: { symbol: " so'm", rate: 13500, position: 'right', decimals: 0 },
        vi: { symbol: '₫', rate: 27000, position: 'right', decimals: 0 }
    };

    const config = currencyMap[lang] || currencyMap['es'];
    const localAmount = amountEur * config.rate;

    let formattedVal = localAmount.toLocaleString(lang === 'en' ? 'en-US' : 'es-ES', {
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals
    });

    if (config.position === 'left') {
        return config.symbol + (lang === 'ko' || lang === 'ja' ? '' : ' ') + formattedVal;
    } else {
        return formattedVal + config.symbol;
    }
}

function updateExpiryDisplay(lang) {
    const expiryEl = document.getElementById('license-expiry-date');
    if (!expiryEl) return;

    const status = localStorage.getItem('talkme_license_status') || 'active';
    const paymentMode = localStorage.getItem('talkme_payment_mode');
    const rawDateStr = localStorage.getItem('talkme_license_expiry_raw') || localStorage.getItem('talkme_license_expiry');
    let validUntilHtml = '';
    if (rawDateStr) {
        const formattedDate = formatExpiryDate(rawDateStr, lang);
        const untilTemplate = (translations[lang] && translations[lang].valid_until) || (translations['es'] && translations['es'].valid_until) || "Válida hasta: {date}";
        const validUntilText = untilTemplate.replace('{date}', formattedDate);
        validUntilHtml = `<div style="font-size: 9.5px; color: #FF9F43; margin-top: 4px; font-weight: 600;">${validUntilText}</div>`;
    }

    if (status === 'trial') {
        const expiryRaw = localStorage.getItem('talkme_license_expiry_raw') || localStorage.getItem('talkme_license_expiry');
        const initialTrialDays = parseInt(localStorage.getItem('talkme_trial_initial_days') || '30', 10);
        let daysLeft = initialTrialDays;
        let percentRemaining = 100;

        if (expiryRaw) {
            const msRemaining = new Date(expiryRaw).getTime() - Date.now();
            daysLeft = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
            percentRemaining = Math.min(100, Math.max(0, Math.round((daysLeft / initialTrialDays) * 100)));
        }

        const template = (translations[lang] && translations[lang].trial_alert_banner)
            || (translations['es'] && translations['es'].trial_alert_banner)
            || "🎁 Modo de prueba gratuita: Restan {days} días de evaluación.";
        const bannerText = template.replace('{days}', daysLeft);

        let colorBar = '#10B981'; // Verde por defecto
        let urgencyText = (translations[lang] && translations[lang].trial_status_active)
            || (translations['es'] && translations['es'].trial_status_active)
            || 'Periodo de prueba activo';
        if (daysLeft <= 5) {
            colorBar = '#EF4444'; // Rojo advertencia
            urgencyText = (translations[lang] && translations[lang].trial_modal_title)
                || (translations['es'] && translations['es'].trial_modal_title)
                || '⚠️ ¡El periodo de prueba expira pronto!';
        } else if (daysLeft <= 15) {
            colorBar = '#F59E0B'; // Naranja
            urgencyText = (translations[lang] && translations[lang].trial_status_intermediate)
                || (translations['es'] && translations['es'].trial_status_intermediate)
                || 'Periodo de prueba intermedio';
        }

        expiryEl.innerHTML = `
            <div style="margin-top: 10px; font-size: 11px; color: rgba(255,255,255,0.85); font-weight: normal; line-height: 1.4; text-align: left;">
                <span style="font-weight: bold; color: ${colorBar}; text-transform: uppercase;">${urgencyText}</span>
                <div style="background: rgba(255,255,255,0.08); height: 8px; border-radius: 4px; overflow: hidden; margin: 6px 0; border: 1px solid rgba(255,255,255,0.05); width: 100%; max-width: 280px;">
                    <div style="background: ${colorBar}; width: ${percentRemaining}%; height: 100%; border-radius: 3px; box-shadow: 0 0 8px ${colorBar}; transition: width 0.5s ease-out;"></div>
                </div>
                <span style="font-size: 10px; color: #fff;">${bannerText}</span>
                ${validUntilHtml}
            </div>
        `;
        expiryEl.style.display = 'block';
        return;
    }

    if (paymentMode === 'rent_to_own') {
        const paid = parseFloat(localStorage.getItem('talkme_total_paid') || '0');
        const total = parseFloat(localStorage.getItem('talkme_total_price') || '169.23');
        const status = localStorage.getItem('talkme_license_status') || 'active';

        const isEnterprise = total > 500;
        const monthlyBase = isEnterprise ? 49.90 : 9.99;
        const formattedBase = formatCurrency(monthlyBase, lang);

        const suffixTemplate = (translations[lang] && translations[lang].monthly_fee_suffix) || (translations['es'] && translations['es'].monthly_fee_suffix) || "{fee}/mes + IVA";
        const monthlyFeeText = suffixTemplate.replace('{fee}', formattedBase);


        if (status === 'trial' || paid === 0) {
            const trialTitle = (translations[lang] && translations[lang].trial_period_active) || (translations['es'] && translations['es'].trial_period_active) || "PERIODO DE PRUEBA (1 Mes)";
            const trialDescTemplate = (translations[lang] && translations[lang].trial_period_desc) || (translations['es'] && translations['es'].trial_period_desc) || "{paid} de {total} • Después ({fee})";
            const formattedPaid = formatCurrency(0, lang);
            const formattedTotal = formatCurrency(total, lang);
            const trialDesc = trialDescTemplate
                .replace('{paid}', formattedPaid)
                .replace('{total}', formattedTotal)
                .replace('{fee}', `<strong>${monthlyFeeText}</strong>`);

            expiryEl.innerHTML = `
                <div style="margin-top: 10px; font-size: 11px; color: rgba(255,255,255,0.85); font-weight: normal; line-height: 1.4; text-align: left;">
                    <span style="font-weight: bold; color: #10B981;">${trialTitle}</span>
                    <div style="background: rgba(255,255,255,0.08); height: 8px; border-radius: 4px; overflow: hidden; margin: 6px 0; border: 1px solid rgba(255,255,255,0.05); width: 100%; max-width: 280px;">
                        <div style="background: #10B981; width: 7%; height: 100%; border-radius: 3px; box-shadow: 0 0 8px #10B981; transition: width 0.5s ease-out;"></div>
                    </div>
                    <span style="font-size: 9.5px; color: #aaa;">${trialDesc}</span>
                    ${validUntilHtml}
                </div>
            `;
            expiryEl.style.display = 'block';
            return;
        }

        const percent = Math.min(100, Math.round((paid / total) * 100));

        // Freelance RTO es 9.99/mes. Enterprise RTO es 49.90/mes.
        const monthlyAmt = total > 500 ? 49.90 : 9.99;
        const monthsPaid = Math.min(14, Math.round(paid / monthlyAmt));
        const monthsLeft = Math.max(0, 14 - monthsPaid);

        const barColor = '#FF9F43'; // Naranja

        const rtoDescTemplate = (translations[lang] && translations[lang].rto_period_desc) || (translations['es'] && translations['es'].rto_period_desc) || "{paid} de {total} ({fee}) • {months} para ser vitalicia.";
        const formattedPaid = formatCurrency(paid, lang);
        const formattedTotal = formatCurrency(total, lang);
        const monthsLabel = (translations[lang] && translations[lang]['lbl_months']) ? translations[lang]['lbl_months'] : 'meses';
        const monthsLeftText = `<strong style="color: #c4bbff;">${monthsLeft} ${monthsLabel}</strong>`;

        const rtoDesc = rtoDescTemplate
            .replace('{paid}', formattedPaid)
            .replace('{total}', formattedTotal)
            .replace('{fee}', `<strong>${monthlyFeeText}</strong>`)
            .replace('{months}', monthsLeftText);

        expiryEl.innerHTML = `
            <div style="margin-top: 10px; font-size: 11px; color: rgba(255,255,255,0.85); font-weight: normal; line-height: 1.4; text-align: left;">
                <span style="font-weight: bold; color: #FF9F43;">Rent-to-Own:</span> ${percent}% pagado
                <div style="background: rgba(255,255,255,0.08); height: 8px; border-radius: 4px; overflow: hidden; margin: 6px 0; border: 1px solid rgba(255,255,255,0.05); width: 100%; max-width: 280px;">
                    <div style="background: ${barColor}; width: ${percent}%; height: 100%; border-radius: 3px; box-shadow: 0 0 8px ${barColor}; transition: width 0.5s ease-out;"></div>
                </div>
                <span style="font-size: 9.5px; color: #aaa;">${rtoDesc}</span>
                ${validUntilHtml}
            </div>
        `;
        expiryEl.style.display = 'block';
        return;
    }

    // ── PAGO ÚNICO / VITALICIA: nunca mostrar fecha de caducidad ──
    const planType = localStorage.getItem('talkme_plan_type') || '';
    const badgeText = document.getElementById('license-active-text')?.innerText || '';
    const isExplicitLifetime = paymentMode === 'one_time'
        || badgeText.toUpperCase().includes('VITALICIA')
        || badgeText.toUpperCase().includes('LIFETIME')
        || badgeText.toUpperCase().includes('BETIKO')
        || (status !== 'trial' && paymentMode !== 'rent_to_own');

    if (isExplicitLifetime) {
        const lifetimeLabel = (translations[lang] && translations[lang].license_lifetime_label)
            || (translations['es'] && translations['es'].license_lifetime_label)
            || '♾️ Licencia Vitalicia — Sin fecha de expiración';

        let cleanText = lifetimeLabel.replace('♾️', '').trim();
        if (lang === 'es') {
            cleanText = "Licencia sin fecha de expiración";
        } else if (lang === 'en') {
            cleanText = "License with no expiry date";
        } else {
            const parts = cleanText.split('—');
            if (parts.length > 1) {
                cleanText = parts[1].trim();
                cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
            }
        }

        expiryEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 5px; color: #10b981; font-weight: 700; font-size: 9.5px; letter-spacing: 0.03em; margin-top: 4px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 13px; height: 13px; flex-shrink: 0; color: #10b981;">
                    <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/>
                </svg>
                <span>${cleanText}</span>
            </div>
        `;
        expiryEl.style.display = 'block';
        return;
    }

    const rawDateStrFallback = localStorage.getItem('talkme_license_expiry_raw');
    const cached = localStorage.getItem('talkme_license_expiry');

    if (!rawDateStrFallback && (!cached || cached === 'null' || cached.trim() === '')) {
        expiryEl.innerText = (translations[lang] && translations[lang].validity_pending) || (translations['es'] && translations['es'].validity_pending) || "Validez: Pendiente de validación";
        expiryEl.style.color = '#aaa';
        expiryEl.style.display = 'block';
        return;
    }

    let dateToFormat = rawDateStrFallback;
    if (!dateToFormat && cached) {
        const parsed = Date.parse(cached);
        if (!isNaN(parsed)) {
            dateToFormat = new Date(parsed).toISOString();
            localStorage.setItem('talkme_license_expiry_raw', dateToFormat);
        }
    }

    const untilTemplate = (translations[lang] && translations[lang].valid_until) || (translations['es'] && translations['es'].valid_until) || "Válida hasta: {date}";

    if (dateToFormat) {
        const formattedDate = formatExpiryDate(dateToFormat, lang);
        expiryEl.innerText = untilTemplate.replace('{date}', formattedDate);
    } else {
        expiryEl.innerText = untilTemplate.replace('{date}', cached);
    }
    expiryEl.style.display = 'block';
    renderVersionUpdatesChannel(lang);
}

// --- RENDERIZADO DINÁMICO DEL CANAL DE VERSIONES Y ACTUALIZACIONES (CASOS A, B Y C) ---
let cachedVersionChannelData = null;

/**
 * Flag de conectividad REAL verificada.
 * navigator.onLine es poco fiable en Electron: devuelve true si hay adaptador de red activo,
 * aunque no haya internet real. Este flag solo se pone a true cuando el backend
 * confirma una respuesta exitosa desde el servidor remoto (source === 'network').
 */
let _talkmeRealOnline = false;

/**
 * Sonda de conectividad real: intenta un fetch ligero al backend local
 * que a su vez consulta el servidor remoto. Retorna true solo si hay internet real.
 * Timeout corto (4s) para no bloquear la UI.
 */
async function isReallyOnline() {
    // Primer filtro rápido: si el SO dice offline, seguro es offline
    if (!navigator.onLine) {
        _talkmeRealOnline = false;
        return false;
    }
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('/api/pricing-channel', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        _talkmeRealOnline = !!(data && data.source === 'network');
    } catch (e) {
        _talkmeRealOnline = false;
    }
    return _talkmeRealOnline;
}

async function fetchPricingAndVersionChannel() {
    try {
        const res = await fetch('/api/pricing-channel');
        const data = await res.json();
        if (data && data.success) {
            window.TALKME_PRICING_MASTER = data;
            // Determinar conectividad real por la fuente de datos
            _talkmeRealOnline = (data.source === 'network');
            // Actualizar tarjetas de compra en UI
            if (data.plans && currentLang) {
                updatePlanCardsPricing(currentLang);
            }
        } else {
            _talkmeRealOnline = false;
        }
    } catch (e) {
        _talkmeRealOnline = false;
        console.warn("⚠️ No se pudo obtener pricing-channel:", e.message);
    }
    // Tras conocer la conectividad real, refrescar el canal de versiones
    // y el estado parpadeante del botón de ajustes y motor
    if (typeof updateSettingsButtonPulse === 'function') {
        updateSettingsButtonPulse();
    }
    if (typeof renderVersionUpdatesChannel === 'function' && currentLang) {
        renderVersionUpdatesChannel(currentLang);
    }
}

function updatePlanCardsPricing(lang) {
    const pricing = window.TALKME_PRICING_MASTER;
    if (!pricing || !pricing.plans) return;

    const freeOt = pricing.plans.freelance.one_time_net;
    const entOt = pricing.plans.enterprise.one_time_net;
    const freeRto = pricing.plans.freelance.rto_monthly_net;
    const entRto = pricing.plans.enterprise.rto_monthly_net;

    const freelanceRtoFee = formatCurrency(freeRto, lang);
    const enterpriseRtoFee = formatCurrency(entRto, lang);
    const freelanceOtPrice = formatCurrency(freeOt, lang);
    const enterpriseOtPrice = formatCurrency(entOt, lang);

    const suffixMo = lang === 'en' ? 'mo' : (lang === 'es' ? 'mes' : (lang === 'eu' ? 'hil' : 'mes'));

    document.querySelectorAll('.freelance-one-time-price').forEach(el => el.innerText = freelanceOtPrice);
    document.querySelectorAll('.enterprise-one-time-price').forEach(el => el.innerText = enterpriseOtPrice);
    document.querySelectorAll('.freelance-rto-price').forEach(el => el.innerText = `${freelanceRtoFee}/${suffixMo}`);
    document.querySelectorAll('.enterprise-rto-price').forEach(el => el.innerText = `${enterpriseRtoFee}/${suffixMo}`);
}

function renderVersionUpdatesChannel(lang) {
    const updatesBox = document.getElementById('license-version-updates-box');
    const badgeEl = document.getElementById('ver-coverage-badge');
    const infoEl = document.getElementById('ver-coverage-info');
    const actionEl = document.getElementById('ver-action-container');

    let channelData = cachedVersionChannelData || (window.TALKME_VALIDATE_PAYLOAD && window.TALKME_VALIDATE_PAYLOAD.version_channel);

    // Ley de Murphy: Si no hay channelData en memoria pero el usuario está offline o reconectando,
    // recuperar la última información conocida guardada previamente en localStorage
    if (!channelData) {
        try {
            const stored = localStorage.getItem('talkme_version_channel');
            if (stored) {
                channelData = JSON.parse(stored);
                cachedVersionChannelData = channelData;
            }
        } catch (e) {
            console.warn("⚠️ Error recuperando talkme_version_channel de localStorage:", e);
        }
    }

    // 🟢 Garantizar que el botón de ajustes (#btnOpenPrelaunchSettings) refleje de inmediato
    // si hay actualización disponible, con independencia del estado de las cajas internas del modal.
    updateSettingsButtonPulse(channelData);

    if (!updatesBox || !infoEl || !actionEl) return;

    if (!channelData) {
        updatesBox.style.display = 'none';
        return;
    }

    updatesBox.style.display = 'block';

    const currentVer = channelData.current_version || 'v0.60.1';
    const status = channelData.status || 'UP_TO_DATE';
    const daysRemaining = channelData.days_remaining || 0;

    // Diccionario i18n en los 24 idiomas soportados por Talk.me
    const updateI18n = {
        es: {
            badge_ready: "¡Actualización lista!",
            badge_major: "Nueva Generación",
            badge_uptodate: "Al día",
            current_ver: "Versión actual:",
            new_available: "Nueva disponible:",
            annual_coverage_active: "Cobertura anual activa ({days} días restantes).",
            btn_download_free: "Descargar e Instalar {ver} (Gratis)",
            major_available: "🎉 ¡Talk.me {ver} ya disponible!",
            major_included: "Incluida en tu cobertura de actualizaciones anual ({days} días restantes).",
            offer_title: "⚡ Talk.me {ver} disponible",
            offer_desc: "Tu versión {cur} sigue activa de por vida. Como cliente de Talk.me tienes un <strong>{disc}% de descuento</strong> con el cupón <code>{promo}</code>.",
            btn_upgrade_offer: "Actualizar a {ver} ({promo})",
            sovereign_lifetime: "(Soberana - Acceso Vitalicio)",
            uptodate_desc: "✔ Tienes instalada la versión más reciente compatible."
        },
        en: {
            badge_ready: "Update ready!",
            badge_major: "Next Generation",
            badge_uptodate: "Up to date",
            current_ver: "Current version:",
            new_available: "New available:",
            annual_coverage_active: "Active annual coverage ({days} days remaining).",
            btn_download_free: "Download & Install {ver} (Free)",
            major_available: "🎉 Talk.me {ver} now available!",
            major_included: "Included in your annual update coverage ({days} days remaining).",
            offer_title: "⚡ Talk.me {ver} available",
            offer_desc: "Your version {cur} remains lifetime active. As a Talk.me customer, you get a <strong>{disc}% discount</strong> with coupon <code>{promo}</code>.",
            btn_upgrade_offer: "Upgrade to {ver} ({promo})",
            sovereign_lifetime: "(Sovereign - Lifetime Access)",
            uptodate_desc: "✔ You have the most recent compatible version installed."
        },
        eu: {
            badge_ready: "Eguneraketa prest!",
            badge_major: "Belaunaldi Berria",
            badge_uptodate: "Eguneratuta",
            current_ver: "Uneko bertsioa:",
            new_available: "Berria eskuragarri:",
            annual_coverage_active: "Urteko estaldura aktiboa ({days} egun geratzen dira).",
            btn_download_free: "Deskargatu eta Instalatu {ver} (Doan)",
            major_available: "🎉 Talk.me {ver} eskuragarri!",
            major_included: "Zure urteko eguneratze estalduran sartuta ({days} egun geratzen dira).",
            offer_title: "⚡ Talk.me {ver} eskuragarri",
            offer_desc: "Zure {cur} bertsioa bizi osorako aktibo mantentzen da. Talk.me bezero gisa <strong>%{disc}ko deskontua</strong> duzu <code>{promo}</code> kupoiarekin.",
            btn_upgrade_offer: "Eguneratu {ver} bertsiora ({promo})",
            sovereign_lifetime: "(Burujabea - Bizi Osorako Sarbidea)",
            uptodate_desc: "✔ Bertsio bateragarri berriena instalatuta daukazu."
        },
        de: {
            badge_ready: "Update bereit!",
            badge_major: "Nächste Generation",
            badge_uptodate: "Aktuell",
            current_ver: "Aktuelle Version:",
            new_available: "Neu verfügbar:",
            annual_coverage_active: "Aktiver Jahresschutz ({days} Tage verbleibend).",
            btn_download_free: "{ver} herunterladen & installieren (Kostenlos)",
            major_available: "🎉 Talk.me {ver} jetzt verfügbar!",
            major_included: "In Ihrem jährlichen Update-Schutz enthalten ({days} Tage verbleibend).",
            offer_title: "⚡ Talk.me {ver} verfügbar",
            offer_desc: "Ihre Version {cur} bleibt lebenslang aktiv. Als Kunde erhalten Sie <strong>{disc}% Rabatt</strong> mit dem Gutschein <code>{promo}</code>.",
            btn_upgrade_offer: "Upgrade auf {ver} ({promo})",
            sovereign_lifetime: "(Souverän - Lebenslanger Zugriff)",
            uptodate_desc: "✔ Sie haben die neueste kompatible Version installiert."
        },
        fr: {
            badge_ready: "Mise à jour prête !",
            badge_major: "Nouvelle Génération",
            badge_uptodate: "À jour",
            current_ver: "Version actuelle :",
            new_available: "Nouvelle disponible :",
            annual_coverage_active: "Couverture annuelle active ({days} jours restants).",
            btn_download_free: "Télécharger & Installer {ver} (Gratuit)",
            major_available: "🎉 Talk.me {ver} disponible !",
            major_included: "Inclus dans votre couverture annuelle de mise à jour ({days} jours restants).",
            offer_title: "⚡ Talk.me {ver} disponible",
            offer_desc: "Votre version {cur} reste active à vie. En tant que client, bénéficiez de <strong>{disc}% de réduction</strong> avec le coupon <code>{promo}</code>.",
            btn_upgrade_offer: "Mettre à niveau vers {ver} ({promo})",
            sovereign_lifetime: "(Souverain - Accès à vie)",
            uptodate_desc: "✔ Vous avez installé la version compatible la plus récente."
        },
        it: {
            badge_ready: "Aggiornamento pronto!",
            badge_major: "Nuova Generazione",
            badge_uptodate: "Aggiornato",
            current_ver: "Versione attuale:",
            new_available: "Nuova disponibile:",
            annual_coverage_active: "Copertura annuale attiva ({days} giorni rimanenti).",
            btn_download_free: "Scarica e Installa {ver} (Gratis)",
            major_available: "🎉 Talk.me {ver} ora disponibile!",
            major_included: "Incluso nella copertura annuale di aggiornamento ({days} giorni rimanenti).",
            offer_title: "⚡ Talk.me {ver} disponibile",
            offer_desc: "La tua versione {cur} rimane attiva a vita. Come cliente hai il <strong>{disc}% di sconto</strong> con il coupon <code>{promo}</code>.",
            btn_upgrade_offer: "Aggiorna a {ver} ({promo})",
            sovereign_lifetime: "(Sovrano - Accesso a vita)",
            uptodate_desc: "✔ Hai installato la versione compatibile più recente."
        },
        pt: {
            badge_ready: "Atualização pronta!",
            badge_major: "Nova Geração",
            badge_uptodate: "Em dia",
            current_ver: "Versão atual:",
            new_available: "Nova disponível:",
            annual_coverage_active: "Cobertura anual ativa ({days} dias restantes).",
            btn_download_free: "Baixar e Instalar {ver} (Grátis)",
            major_available: "🎉 Talk.me {ver} já disponível!",
            major_included: "Incluído na sua cobertura anual de atualizações ({days} dias restantes).",
            offer_title: "⚡ Talk.me {ver} disponível",
            offer_desc: "Sua versão {cur} continua ativa para sempre. Como cliente você tem <strong>{disc}% de desconto</strong> com o cupom <code>{promo}</code>.",
            btn_upgrade_offer: "Atualizar para {ver} ({promo})",
            sovereign_lifetime: "(Soberano - Acesso Vitalício)",
            uptodate_desc: "✔ Você possui a versão compatível mais recente instalada."
        },
        ca: {
            badge_ready: "Actualització a punt!",
            badge_major: "Nova Generació",
            badge_uptodate: "Al dia",
            current_ver: "Versió actual:",
            new_available: "Nova disponible:",
            annual_coverage_active: "Cobertura anual activa ({days} dies restants).",
            btn_download_free: "Descarregar i Instal·lar {ver} (Gratis)",
            major_available: "🎉 Talk.me {ver} ja disponible!",
            major_included: "Inclosa en la teva cobertura d'actualitzacions anual ({days} dies restants).",
            offer_title: "⚡ Talk.me {ver} disponible",
            offer_desc: "La teva versió {cur} continua activa de per vida. Com a client tens un <strong>{disc}% de descompte</strong> amb el cupó <code>{promo}</code>.",
            btn_upgrade_offer: "Actualitzar a {ver} ({promo})",
            sovereign_lifetime: "(Sobirà - Accés Vitalici)",
            uptodate_desc: "✔ Tens instal·lada la versió més recent compatible."
        },
        gl: {
            badge_ready: "Actualización lista!",
            badge_major: "Nova Xeración",
            badge_uptodate: "Ao día",
            current_ver: "Versión actual:",
            new_available: "Nova dispoñible:",
            annual_coverage_active: "Cobertura anual activa ({days} días restantes).",
            btn_download_free: "Descargar e Instalar {ver} (Gratis)",
            major_available: "🎉 Talk.me {ver} xa dispoñible!",
            major_included: "Incluída na túa cobertura de actualizacións anual ({days} días restantes).",
            offer_title: "⚡ Talk.me {ver} dispoñible",
            offer_desc: "A túa versión {cur} segue activa de por vida. Como cliente tes un <strong>{disc}% de desconto</strong> co cupón <code>{promo}</code>.",
            btn_upgrade_offer: "Actualizar a {ver} ({promo})",
            sovereign_lifetime: "(Soberano - Acceso Vitalicio)",
            uptodate_desc: "✔ Tes instalada a versión máis recente compatible."
        },
        nl: {
            badge_ready: "Update gereed!",
            badge_major: "Nieuwe Generatie",
            badge_uptodate: "Up-to-date",
            current_ver: "Huidige versie:",
            new_available: "Nieuwe beschikbaar:",
            annual_coverage_active: "Actieve jaarlijkse dekking ({days} dagen resterend).",
            btn_download_free: "Download & Installeer {ver} (Gratis)",
            major_available: "🎉 Talk.me {ver} nu beschikbaar!",
            major_included: "Inbegrepen in uw jaarlijkse update-dekking ({days} dagen resterend).",
            offer_title: "⚡ Talk.me {ver} beschikbaar",
            offer_desc: "Uw versie {cur} blijft levenslang actief. Als klant krijgt u <strong>{disc}% korting</strong> met coupon <code>{promo}</code>.",
            btn_upgrade_offer: "Upgrade naar {ver} ({promo})",
            sovereign_lifetime: "(Soeverein - Levenslange Toegang)",
            uptodate_desc: "✔ U heeft de meest recente compatibele versie geïnstalleerd."
        },
        ru: {
            badge_ready: "Обновление готово!",
            badge_major: "Новое поколение",
            badge_uptodate: "Актуально",
            current_ver: "Текущая версия:",
            new_available: "Доступна новая:",
            annual_coverage_active: "Активная годовая поддержка (осталось {days} дн.).",
            btn_download_free: "Скачать и установить {ver} (Бесплатно)",
            major_available: "🎉 Talk.me {ver} уже доступна!",
            major_included: "Включено в вашу годовую поддержку обновлений (осталось {days} дн.).",
            offer_title: "⚡ Talk.me {ver} доступна",
            offer_desc: "Ваша версия {cur} остаётся активной бессрочно. Для вас действует <strong>скидка {disc}%</strong> по промокоду <code>{promo}</code>.",
            btn_upgrade_offer: "Обновить до {ver} ({promo})",
            sovereign_lifetime: "(Суверенный - Бессрочный доступ)",
            uptodate_desc: "✔ У вас установлена самая последняя совместимая версия."
        },
        zh: {
            badge_ready: "更新已就绪！",
            badge_major: "全新一代",
            badge_uptodate: "已是最新",
            current_ver: "当前版本：",
            new_available: "新版本可用：",
            annual_coverage_active: "年度更新保障生效中（剩余 {days} 天）。",
            btn_download_free: "下载并安装 {ver}（免费）",
            major_available: "🎉 Talk.me {ver} 现已发布！",
            major_included: "已包含在您的年度更新保障中（剩余 {days} 天）。",
            offer_title: "⚡ Talk.me {ver} 现已推出",
            offer_desc: "您的 {cur} 版本永久有效。作为老用户，使用优惠码 <code>{promo}</code> 可享 <strong>{disc}% 折扣</strong>。",
            btn_upgrade_offer: "升级到 {ver} ({promo})",
            sovereign_lifetime: "(主权自主 · 终身使用)",
            uptodate_desc: "✔ 您已安装最新的兼容版本。"
        },
        ja: {
            badge_ready: "アップデート準備完了！",
            badge_major: "次世代バージョン",
            badge_uptodate: "最新",
            current_ver: "現在のバージョン:",
            new_available: "利用可能な新バージョン:",
            annual_coverage_active: "年間アップデート保証期間内 (残り {days} 日)。",
            btn_download_free: "{ver} をダウンロードしてインストール (無料)",
            major_available: "🎉 Talk.me {ver} が利用可能になりました！",
            major_included: "年間アップデート保証に含まれています (残り {days} 日)。",
            offer_title: "⚡ Talk.me {ver} が利用可能",
            offer_desc: "現在のバージョン {cur} は生涯有効です。クーポン <code>{promo}</code> で <strong>{disc}% 割引</strong> が適用されます。",
            btn_upgrade_offer: "{ver} にアップグレード ({promo})",
            sovereign_lifetime: "(ソブリン · 生涯アクセス)",
            uptodate_desc: "✔ 最新の互換バージョンがインストールされています。"
        },
        ko: {
            badge_ready: "업데이트 준비 완료!",
            badge_major: "차세대 버전",
            badge_uptodate: "최신 상태",
            current_ver: "현재 버전:",
            new_available: "사용 가능한 최신 버전:",
            annual_coverage_active: "연간 업데이트 보증 적용 중 (남은 기간 {days}일).",
            btn_download_free: "{ver} 다운로드 및 설치 (무료)",
            major_available: "🎉 Talk.me {ver} 출시!",
            major_included: "연간 업데이트 보증에 포함되어 있습니다 (남은 기간 {days}일).",
            offer_title: "⚡ Talk.me {ver} 사용 가능",
            offer_desc: "현재 버전 {cur}은 평생 사용할 수 있습니다. 쿠폰 <code>{promo}</code>로 <strong>{disc}% 할인</strong>을 받으세요.",
            btn_upgrade_offer: "{ver}(으)로 업그레이드 ({promo})",
            sovereign_lifetime: "(주권 보장 · 평생 이용)",
            uptodate_desc: "✔ 가장 최신의 호환 버전이 설치되어 있습니다."
        },
        pl: {
            badge_ready: "Aktualizacja gotowa!",
            badge_major: "Nowa Generacja",
            badge_uptodate: "Aktualna",
            current_ver: "Aktualna wersja:",
            new_available: "Dostępna nowa:",
            annual_coverage_active: "Aktywna roczna ochrona (pozostało {days} dni).",
            btn_download_free: "Pobierz i zainstaluj {ver} (Bezpłatnie)",
            major_available: "🎉 Talk.me {ver} już dostępna!",
            major_included: "Zawarta w rocznej ochronie aktualizacji (pozostało {days} dni).",
            offer_title: "⚡ Talk.me {ver} dostępna",
            offer_desc: "Twoja wersja {cur} pozostaje aktywna na zawsze. Z kodem <code>{promo}</code> otrzymujesz <strong>{disc}% zniżki</strong>.",
            btn_upgrade_offer: "Zaktualizuj do {ver} ({promo})",
            sovereign_lifetime: "(Suwerenny - Dostęp wieczysty)",
            uptodate_desc: "✔ Masz zainstalowaną najnowszą kompatybilną wersję."
        },
        tr: {
            badge_ready: "Güncelleme hazır!",
            badge_major: "Yeni Nesil",
            badge_uptodate: "Güncel",
            current_ver: "Mevcut sürüm:",
            new_available: "Yeni sürüm:",
            annual_coverage_active: "Aktif yıllık güncelleme hakkı ({days} gün kaldı).",
            btn_download_free: "{ver} İndir ve Kur (Ücretsiz)",
            major_available: "🎉 Talk.me {ver} hazır!",
            major_included: "Yıllık güncelleme kapsamınızda dahildir ({days} gün kaldı).",
            offer_title: "⚡ Talk.me {ver} yayında",
            offer_desc: "{cur} sürümünüz ömür boyu geçerlidir. <code>{promo}</code> kuponuyla <strong>%{disc} indirim</strong> kazanın.",
            btn_upgrade_offer: "{ver} Sürümüne Yükselt ({promo})",
            sovereign_lifetime: "(Egemen - Ömür Boyu Erişim)",
            uptodate_desc: "✔ En güncel uyumlu sürüm yüklü."
        },
        sv: {
            badge_ready: "Uppdatering redo!",
            badge_major: "Ny Generation",
            badge_uptodate: "Uppdaterad",
            current_ver: "Aktuell version:",
            new_available: "Ny tillgänglig:",
            annual_coverage_active: "Aktivt årligt skydd ({days} dagar kvar).",
            btn_download_free: "Ladda ner & Installera {ver} (Gratis)",
            major_available: "🎉 Talk.me {ver} är tillgänglig!",
            major_included: "Ingår i ditt årliga uppdateringsskydd ({days} dagar kvar).",
            offer_title: "⚡ Talk.me {ver} tillgänglig",
            offer_desc: "Din version {cur} förblir aktiv på livstid. Som kund får du <strong>{disc}% rabatt</strong> med kupong <code>{promo}</code>.",
            btn_upgrade_offer: "Uppgradera till {ver} ({promo})",
            sovereign_lifetime: "(Suverän - Livstidsåtkomst)",
            uptodate_desc: "✔ Du har den senaste kompatibla versionen installerad."
        },
        uk: {
            badge_ready: "Оновлення готове!",
            badge_major: "Нове покоління",
            badge_uptodate: "Актуально",
            current_ver: "Поточна версія:",
            new_available: "Доступна нова:",
            annual_coverage_active: "Активна річна підтримка (залишилося {days} дн.).",
            btn_download_free: "Завантажити та встановити {ver} (Безкоштовно)",
            major_available: "🎉 Talk.me {ver} вже доступна!",
            major_included: "Включено у вашу річну підтримку оновлень (залишилося {days} дн.).",
            offer_title: "⚡ Talk.me {ver} доступна",
            offer_desc: "Ваша версія {cur} залишається активною довічно. Для вас діє <strong>знижка {disc}%</strong> за промокодом <code>{promo}</code>.",
            btn_upgrade_offer: "Оновити до {ver} ({promo})",
            sovereign_lifetime: "(Суверенний - Довічний доступ)",
            uptodate_desc: "✔ У вас встановлена найновіша сумісна версія."
        },
        ar: {
            badge_ready: "التحديث جاهز!",
            badge_major: "الجيل الجديد",
            badge_uptodate: "محدث",
            current_ver: "الإصدار الحالي:",
            new_available: "إصدار جديد متاح:",
            annual_coverage_active: "التغطية السنوية نشطة (متبقي {days} يوم).",
            btn_download_free: "تنزيل وتثبيت {ver} (مجاناً)",
            major_available: "🎉 Talk.me {ver} متاح الآن!",
            major_included: "مشمول في تغطية التحديثات السنوية الخاصة بك (متبقي {days} يوم).",
            offer_title: "⚡ Talk.me {ver} متاح",
            offer_desc: "إصدارك {cur} يظل نشطاً مدى الحياة. كعميل تحصل على <strong>خصم {disc}%</strong> باستخدام القسيمة <code>{promo}</code>.",
            btn_upgrade_offer: "الترقية إلى {ver} ({promo})",
            sovereign_lifetime: "(سيادي - وصول مدى الحياة)",
            uptodate_desc: "✔ لديك أحدث إصدار متوافق مثبت."
        },
        fa: {
            badge_ready: "به‌روزرسانی آماده است!",
            badge_major: "نسل جدید",
            badge_uptodate: "به‌روز",
            current_ver: "نسخه فعلی:",
            new_available: "نسخه جدید موجود:",
            annual_coverage_active: "پوشش سالانه فعال است ({days} روز باقی مانده).",
            btn_download_free: "دانلود و نصب {ver} (رایگان)",
            major_available: "🎉 Talk.me {ver} اکنون در دسترس است!",
            major_included: "شامل پوشش به‌روزرسانی سالانه شما است ({days} روز باقی مانده).",
            offer_title: "⚡ Talk.me {ver} موجود است",
            offer_desc: "نسخه {cur} شما مادام‌العمر فعال می‌ماند. با کد تخفیف <code>{promo}</code> از <strong>{disc}٪ تخفیف</strong> بهره‌مند شوید.",
            btn_upgrade_offer: "ارتقا به {ver} ({promo})",
            sovereign_lifetime: "(مستقل - دسترسی مادام‌العمر)",
            uptodate_desc: "✔ جدیدترین نسخه سازگار نصب شده است."
        },
        eo: {
            badge_ready: "Ĝisdatigo preta!",
            badge_major: "Nova Generacio",
            badge_uptodate: "Ĝisdata",
            current_ver: "Aktuala versio:",
            new_available: "Nova disponebla:",
            annual_coverage_active: "Aktiva jara kovrado ({days} tagoj restantaj).",
            btn_download_free: "Elŝuti kaj Instali {ver} (Senpage)",
            major_available: "🎉 Talk.me {ver} nun disponebla!",
            major_included: "Inkludita en via jara ĝisdatiga kovrado ({days} tagoj restantaj).",
            offer_title: "⚡ Talk.me {ver} disponebla",
            offer_desc: "Via versio {cur} restas vivdaŭre aktiva. Kiel kliento vi havas <strong>{disc}% rabaton</strong> per kupono <code>{promo}</code>.",
            btn_upgrade_offer: "Ĝisdatigi al {ver} ({promo})",
            sovereign_lifetime: "(Suverena - Vivdaŭra Aliro)",
            uptodate_desc: "✔ Vi havas instalita la plej freŝan kongruan version."
        },
        vi: {
            badge_ready: "Bản cập nhật đã sẵn sàng!",
            badge_major: "Thế hệ mới",
            badge_uptodate: "Mới nhất",
            current_ver: "Phiên bản hiện tại:",
            new_available: "Bản mới có sẵn:",
            annual_coverage_active: "Gói cập nhật năm đang hoạt động (còn {days} ngày).",
            btn_download_free: "Tải về & Cài đặt {ver} (Miễn phí)",
            major_available: "🎉 Talk.me {ver} hiện đã có sẵn!",
            major_included: "Đã bao gồm trong gói cập nhật năm của bạn (còn {days} ngày).",
            offer_title: "⚡ Talk.me {ver} đã sẵn sàng",
            offer_desc: "Phiên bản {cur} của bạn vẫn có giá trị trọn đời. Với tư cách khách hàng, bạn được <strong>giảm giá {disc}%</strong> với mã <code>{promo}</code>.",
            btn_upgrade_offer: "Nâng cấp lên {ver} ({promo})",
            sovereign_lifetime: "(Độc lập - Quyền truy cập trọn đời)",
            uptodate_desc: "✔ Bạn đã cài đặt phiên bản tương thích mới nhất."
        },
        uz: {
            badge_ready: "Yangilanish tayyor!",
            badge_major: "Yangi avlod",
            badge_uptodate: "Eng so'nggi",
            current_ver: "Joriy versiya:",
            new_available: "Yangi versiya mavjud:",
            annual_coverage_active: "Yillik yangilanish faol ({days} kun qoldi).",
            btn_download_free: "{ver} yuklab olish va o'rnatish (Bepul)",
            major_available: "🎉 Talk.me {ver} tayyor!",
            major_included: "Yillik yangilanish kafolatingizga kiritilgan ({days} kun qoldi).",
            offer_title: "⚡ Talk.me {ver} mavjud",
            offer_desc: "{cur} versiyangiz umrbod faol qoladi. Mijoz sifatida <code>{promo}</code> kuponi bilan <strong>{disc}% chegirma</strong> olasiz.",
            btn_upgrade_offer: "{ver} versiyasiga yangilash ({promo})",
            sovereign_lifetime: "(Mustaqil - Umrbod kirish)",
            uptodate_desc: "✔ Eng so'nggi mos versiya o'rnatilgan."
        },
        kk: {
            badge_ready: "Жаңарту дайын!",
            badge_major: "Жаңа буын",
            badge_uptodate: "Жаңартылған",
            current_ver: "Ағымдағы нұсқа:",
            new_available: "Жаңа нұсқа қолжетімді:",
            annual_coverage_active: "Жылдық жаңарту белсенді ({days} күн қалды).",
            btn_download_free: "{ver} жүктеп орнату (Тегін)",
            major_available: "🎉 Talk.me {ver} енді қолжетімді!",
            major_included: "Сіздің жылдық жаңартуыңызға енгізілген ({days} күн қалды).",
            offer_title: "⚡ Talk.me {ver} қолжетімді",
            offer_desc: "Сіздің {cur} нұсқаңыз өмір бойы белсенді қалады. Клиент ретінде <code>{promo}</code> купонымен <strong>{disc}% жеңілдік</strong> аласыз.",
            btn_upgrade_offer: "{ver} нұсқасына дейін жаңарту ({promo})",
            sovereign_lifetime: "(Егемен - Өмірлік қолжетімділік)",
            uptodate_desc: "✔ Сізде ең соңғы үйлесімді нұсқа орнатылған."
        }
    };

    const loc = updateI18n[lang] || updateI18n['en'] || updateI18n['es'];

    // Badge
    if (badgeEl) {
        if (status === 'UPDATE_AVAILABLE_FREE' || status === 'MAJOR_UPDATE_FREE') {
            badgeEl.innerText = loc.badge_ready;
            badgeEl.style.background = 'rgba(16, 185, 129, 0.25)';
            badgeEl.style.color = '#10B981';
        } else if (status === 'UPGRADE_OFFER') {
            badgeEl.innerText = loc.badge_major;
            badgeEl.style.background = 'rgba(162, 155, 254, 0.25)';
            badgeEl.style.color = '#a29bfe';
        } else {
            badgeEl.innerText = loc.badge_uptodate;
            badgeEl.style.background = 'rgba(255, 255, 255, 0.08)';
            badgeEl.style.color = '#aaa';
        }
    }

    // Diccionario i18n para el aviso cuando no hay conexión a internet
    const offlineNoticeI18n = {
        es: "Para descargar e instalar esta actualización, cierra y abre la aplicación con conexión a internet.",
        en: "To download and install this update, close and open the application with an internet connection.",
        eu: "Eguneraketa hau deskargatu eta instalatzeko, itxi eta ireki aplikazioa interneteko konexioarekin.",
        de: "Um dieses Update herunterzuladen und zu installieren, schließen und öffnen Sie die Anwendung mit Internetverbindung.",
        fr: "Pour télécharger et installer cette mise à jour, fermez et rouvrez l'application avec une connexion internet.",
        it: "Per scaricare e installare questo aggiornamento, chiudi e riapri l'applicazione con connessione internet.",
        pt: "Para baixar e instalar esta atualização, feche e abra o aplicativo com conexão à internet.",
        ca: "Per descarregar i instal·lar aquesta actualització, tanca i obre l'aplicació amb connexió a internet.",
        gl: "Para descargar e instalar esta actualización, pecha e abre a aplicación con conexión a internet.",
        nl: "Om deze update te downloaden en te installeren, sluit en open de applicatie met een internetverbinding.",
        ru: "Чтобы скачать и установить это обновление, закройте и откройте приложение при наличии подключения к интернету.",
        zh: "若要下载并安装此更新，请在连接互联网的状态下重新启动应用程序。",
        ja: "このアップデートをダウンロードしてインストールするには、インターネットに接続した状態でアプリを再起動してください。",
        ko: "이 업데이트를 다운로드하고 설치하려면 인터넷이 연결된 상태에서 애플리케이션을 다시 시작하세요.",
        pl: "Aby pobrać i zainstalować tę aktualizację, zamknij i otwórz aplikację z połączeniem internetowym.",
        tr: "Bu güncellemeyi indirip yüklemek için uygulamayı internet bağlantısı varken kapatıp açın.",
        sv: "För att ladda ner och installera denna uppdatering, stäng och öppna applikationen med internetanslutning.",
        uk: "Щоб завантажити та встановити це оновлення, закрийте та відкрийте програму з підключенням до інтернету.",
        ar: "لتنزيل هذا التحديث وتثبيته، يرجى إغلاق التطبيق وإعادة فتحه مع اتصال بالإنترنت.",
        fa: "برای بارگیری و نصب این به‌روزرسانی، لطفاً برنامه را با اتصال به اینترنت بسته و دوباره باز کنید.",
        eo: "Por elŝuti kaj instali ĉi tiun ĝisdatigon, fermu kaj remalfermu la aplikaĵon kun interreta konekto.",
        vi: "Để tải xuống và cài đặt bản cập nhật này, vui lòng đóng và mở lại ứng dụng khi có kết nối internet.",
        uz: "Ushbu yangilanishni yuklab olish va o'rnatish uchun ilovani internet aloqasi bilan yopib qayta oching.",
        kk: "Бұл жаңартуды жүктеп орнату үшін қолданбаны интернет байланысы бар кезде жауып қайта ашыңыз."
    };

    const isOffline = !_talkmeRealOnline;
    const offlineNoticeText = offlineNoticeI18n[lang] || offlineNoticeI18n['en'] || offlineNoticeI18n['es'];
    const offlineAlertHtml = `
        <div style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; font-size: 12px; line-height: 1.45; text-align: left;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>${offlineNoticeText}</span>
        </div>
    `;

    // Caso A: Actualización menor gratuita
    if (status === 'UPDATE_AVAILABLE_FREE') {
        const activeTxt = loc.annual_coverage_active.replace('{days}', daysRemaining);
        const btnTxt = loc.btn_download_free.replace('{ver}', channelData.target_version);
        infoEl.innerHTML = `
            <div style="font-size: 14px; line-height: 1.45; color: #fff;"><strong>${loc.current_ver}</strong> ${currentVer} &rarr; <strong>${loc.new_available}</strong> <span style="color: #10B981; font-weight: 800;">${channelData.target_version}</span></div>
            <div style="font-size: 13px; color: #9aa0a6; margin-top: 5px; line-height: 1.4;">${activeTxt}</div>
        `;
        if (isOffline) {
            actionEl.innerHTML = offlineAlertHtml;
        } else {
            actionEl.innerHTML = `
                <a href="${channelData.download_url}" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 10px 16px; background: #10B981; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    ${btnTxt}
                </a>
            `;
        }
    }
    // Caso C-1: Salto mayor gratis dentro del año
    else if (status === 'MAJOR_UPDATE_FREE') {
        const majorTxt = loc.major_available.replace('{ver}', channelData.target_version);
        const includedTxt = loc.major_included.replace('{days}', daysRemaining);
        const btnTxt = loc.btn_download_free.replace('{ver}', channelData.target_version);
        infoEl.innerHTML = `
            <div style="color: #ffd32a; font-weight: 700; font-size: 14px; margin-bottom: 5px; line-height: 1.4;">${majorTxt}</div>
            <div style="font-size: 13px; color: #9aa0a6; line-height: 1.4;">${includedTxt}</div>
        `;
        if (isOffline) {
            actionEl.innerHTML = offlineAlertHtml;
        } else {
            actionEl.innerHTML = `
                <a href="${channelData.download_url}" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 10px 16px; background: #10B981; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    ${btnTxt}
                </a>
            `;
        }
    }
    // Caso C-2: Salto mayor con oferta de fidelidad
    else if (status === 'UPGRADE_OFFER') {
        const origFmt = formatCurrency(channelData.original_price || 139.89, lang);
        const discFmt = formatCurrency(channelData.discounted_price || 69.95, lang);
        const promo = channelData.promo_code || 'FIDELIDAD50';
        const url = channelData.checkout_url || '#';
        const targetV = channelData.new_version || '';
        const offerTitle = loc.offer_title.replace('{ver}', targetV);
        const offerDesc = loc.offer_desc
            .replace('{cur}', currentVer)
            .replace('{disc}', channelData.discount_percent || 50)
            .replace('{promo}', promo);
        const btnOfferTxt = loc.btn_upgrade_offer
            .replace('{ver}', targetV)
            .replace('{promo}', promo);

        infoEl.innerHTML = `
            <div style="font-weight: 700; color: #a29bfe; font-size: 14px; margin-bottom: 5px; line-height: 1.4;">${offerTitle}</div>
            <div style="font-size: 12.5px; color: #b0b3b8; margin-bottom: 6px; line-height: 1.45;">${offerDesc}</div>
            <div style="font-size: 14px; margin-top: 5px;">
                <span style="text-decoration: line-through; color: #777; margin-right: 8px;">${origFmt}</span>
                <span style="color: #10B981; font-weight: 800; font-size: 16px;">${discFmt}</span>
            </div>
        `;
        if (isOffline) {
            actionEl.innerHTML = offlineAlertHtml;
        } else {
            actionEl.innerHTML = `
                <a href="${url}" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 10px 16px; background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);">
                    ${btnOfferTxt}
                </a>
            `;
        }
    }
    // Caso B: Software al día
    else {
        infoEl.innerHTML = `
            <div style="font-size: 14px; line-height: 1.45; color: #fff;"><strong>${loc.current_ver}</strong> ${currentVer} ${loc.sovereign_lifetime}</div>
            <div style="font-size: 13px; color: #9aa0a6; margin-top: 5px; line-height: 1.4;">${loc.uptodate_desc}</div>
        `;
        actionEl.innerHTML = '';
    }

    // Comprobar y actualizar el banner de aviso y el badge de ajustes
    checkAndDisplayUpdateAlert(channelData, lang, loc);
}

/**
 * 🟢 Compara dos cadenas de versión semántica (ej. "v1.8.0" vs "v1.0.0", "1.2" vs "1.0").
 * Devuelve:
 *   1 si target > current (hay actualización disponible)
 *   0 si target == current
 *  -1 si target < current
 */
function compareSemver(target, current) {
    if (!target || !current) return 0;
    const cleanT = String(target).replace(/^[vV]/, '').trim();
    const cleanC = String(current).replace(/^[vV]/, '').trim();
    const tParts = cleanT.split('.').map(n => parseInt(n, 10) || 0);
    const cParts = cleanC.split('.').map(n => parseInt(n, 10) || 0);
    const maxLen = Math.max(tParts.length, cParts.length, 3);
    for (let i = 0; i < maxLen; i++) {
        const tVal = tParts[i] || 0;
        const cVal = cParts[i] || 0;
        if (tVal > cVal) return 1;
        if (tVal < cVal) return -1;
    }
    return 0;
}

/**
 * 🟢 Actualiza el estado visual del botón de ajustes (#btnOpenPrelaunchSettings) y motor (#motor-status).
 * Aplica .has-update y .has-update-pulse (borde verde y texto parpadeante) de forma inmediata
 * si el canal de versiones reporta actualización disponible o si la versión remota es superior a la instalada.
 */
function updateSettingsButtonPulse(providedChannelData) {
    let channelData = providedChannelData || cachedVersionChannelData || (window.TALKME_VALIDATE_PAYLOAD && window.TALKME_VALIDATE_PAYLOAD.version_channel);
    if (!channelData) {
        try {
            const stored = localStorage.getItem('talkme_version_channel');
            if (stored) {
                channelData = JSON.parse(stored);
                cachedVersionChannelData = channelData;
            }
        } catch (e) { }
    }

    const currentAppVer = 'v0.60.1';
    let targetVer = null;
    let isUpdateAvailable = false;

    // 1. Detección directa por status devuelto por el servidor central
    const status = channelData ? channelData.status : null;
    if (status === 'UPDATE_AVAILABLE_FREE' || status === 'MAJOR_UPDATE_FREE' || status === 'UPGRADE_OFFER') {
        isUpdateAvailable = true;
    }

    // 2. Detección universal de versiones superiores (1.8, 1.2, 1.1, etc.) por semver
    if (!isUpdateAvailable) {
        if (channelData && (channelData.target_version || channelData.latest_version)) {
            targetVer = channelData.target_version || channelData.latest_version;
        } else if (window.TALKME_PRICING_MASTER && window.TALKME_PRICING_MASTER.latest_release && window.TALKME_PRICING_MASTER.latest_release.version) {
            targetVer = window.TALKME_PRICING_MASTER.latest_release.version;
        }

        if (targetVer && compareSemver(targetVer, currentAppVer) > 0) {
            isUpdateAvailable = true;
        }
    }

    const btnSettings = document.getElementById('btnOpenPrelaunchSettings');
    const motorStatusEl = document.getElementById('motor-status');

    if (btnSettings) {
        if (isUpdateAvailable) {
            btnSettings.classList.add('has-update');
            btnSettings.classList.add('has-update-pulse');
        } else {
            btnSettings.classList.remove('has-update');
            btnSettings.classList.remove('has-update-pulse');
        }
    }

    if (motorStatusEl) {
        if (isUpdateAvailable) {
            motorStatusEl.classList.add('has-update-pulse');
        } else {
            motorStatusEl.classList.remove('has-update-pulse');
        }
    }
}

/**
 * Muestra el modal flotante proactivo estilo customAlertModal si hay actualización elegible
 * y el usuario no ha pulsado 'Posponer' en esta sesión.
 */
function checkAndDisplayUpdateAlert(channelData, lang, locParam) {
    // Actualizar siempre el borde verde parpadeante de la llave primero
    updateSettingsButtonPulse(channelData);

    if (!channelData) return;

    const modal = document.getElementById('updateAlertModal');
    const badgeDot = document.getElementById('settings-update-badge-dot');
    const titleEl = document.getElementById('updateAlertTitle');
    const textEl = document.getElementById('updateAlertText');
    const btnPostpone = document.getElementById('updateAlertBtnPostpone');
    const btnDownload = document.getElementById('updateAlertBtnDownload');

    const status = channelData.status;
    const isUpdateAvailable = (status === 'UPDATE_AVAILABLE_FREE' || status === 'MAJOR_UPDATE_FREE' || status === 'UPGRADE_OFFER');

    // Guardia de sesión autenticada (Ley de Murphy):
    // El modal emergente de actualización solo debe mostrarse a usuarios que hayan iniciado sesión
    // y cuya licencia esté validada en la cabina (evita alertas a usuarios anónimos o no logueados).
    const isSessionActive = (localStorage.getItem('talkme_session_active') === 'true');
    const isIgnitionVisible = document.getElementById('sec-start-server') && document.getElementById('sec-start-server').style.display === 'block';
    const hasLicense = !!localStorage.getItem('talkme_license');
    if (!isSessionActive || (!isIgnitionVisible && !hasLicense)) {
        if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
        return;
    }

    // Guardia de conectividad para el MODAL FLOTANTE:
    // Nunca mostrar el modal intrusivo si no hay internet real verificada (_talkmeRealOnline === false).
    if (!_talkmeRealOnline) {
        if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
        return;
    }

    if (!modal) return;

    if (!isUpdateAvailable) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        return;
    }

    // Respetar decisión del usuario si ha pulsado 'Posponer' durante la sesión actual
    if (sessionStorage.getItem('talkme_update_postponed') === 'true') {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        return;
    }

    // Diccionario i18n para los textos del modal flotante en 24 idiomas
    const bannerI18n = {
        es: { title: "Nueva {ver} disponible", free: "Tu cobertura anual incluye esta actualización gratis.", major: "Tu cobertura anual incluye este salto mayor gratis.", offer: "Tu soberanía está cubierta, pero si quieres las nuevas funcionalidades te ofrecemos un descuento por apoyarnos.", postpone: "Posponer", download: "Descargar" },
        en: { title: "New {ver} available", free: "Your annual coverage includes this update for free.", major: "Your annual coverage includes this major upgrade for free.", offer: "Your sovereignty is covered, but if you want the new features we offer you a discount for supporting us.", postpone: "Postpone", download: "Download" },
        eu: { title: "{ver} berria eskuragarri", free: "Zure urteko estaldurak eguneraketa hau doan barne hartzen du.", major: "Zure urteko estaldurak bertsio berritze nagusi hau doan barne hartzen du.", offer: "Zure burujabetza estalia dago, baina funtzio berriak nahi badituzu, laguntzearren deskontu bat eskaintzen dizugu.", postpone: "Atzeratu", download: "Deskargatu" },
        de: { title: "Neue {ver} verfügbar", free: "Ihr jährlicher Schutz beinhaltet dieses Update kostenlos.", major: "Ihr jährlicher Schutz beinhaltet dieses Upgrade kostenlos.", offer: "Ihre Souveränität ist abgedeckt, aber wenn Sie neue Funktionen möchten, bieten wir Ihnen einen Rabatt für Ihre Unterstützung.", postpone: "Verschieben", download: "Herunterladen" },
        fr: { title: "Nouvelle {ver} disponible", free: "Votre couverture annuelle inclut cette mise à jour gratuitement.", major: "Votre couverture annuelle inclut cette mise à niveau gratuitement.", offer: "Votre souveraineté est couverte, mais si vous souhaitez les nouvelles fonctionnalités, nous vous offrons une remise pour votre soutien.", postpone: "Reporter", download: "Télécharger" },
        it: { title: "Nuova {ver} disponibile", free: "La tua copertura annuale include questo aggiornamento gratuitamente.", major: "La tua copertura annuale include questo upgrade gratuitamente.", offer: "La tua sovranità è coperta, ma se vuoi le nuove funzionalità ti offriamo uno sconto per supportarci.", postpone: "Posticipa", download: "Scarica" },
        pt: { title: "Nova {ver} disponível", free: "Sua cobertura anual inclui esta atualização gratuitamente.", major: "Sua cobertura anual inclui este upgrade gratuitamente.", offer: "A tua soberania está coberta, mas se quiseres as novas funcionalidades oferecemos-te um desconto pelo teu apoio.", postpone: "Adiar", download: "Baixar" },
        ca: { title: "Nova {ver} disponible", free: "La teva cobertura anual inclou aquesta actualització gratis.", major: "La teva cobertura anual inclou aquest salt major gratis.", offer: "La teva sobirania està coberta, però si vols les noves funcionalitats t'oferim un descompte per donar-nos suport.", postpone: "Posposar", download: "Descarregar" },
        gl: { title: "Nova {ver} dispoñible", free: "A túa cobertura anual inclúe esta actualización gratis.", major: "A túa cobertura anual inclúe este salto maior gratis.", offer: "A túa soberanía está cuberta, pero se queres as novas funcionalidades ofrecémosche un desconto por apoiarnos.", postpone: "Pospoñer", download: "Descargar" },
        nl: { title: "Nieuwe {ver} beschikbaar", free: "Uw jaarlijkse dekking bevat deze update gratis.", major: "Uw jaarlijkse dekking bevat deze upgrade gratis.", offer: "Uw soevereiniteit is gedekt, maar als u nieuwe functies wilt bieden we u een korting voor uw steun.", postpone: "Uitstellen", download: "Downloaden" },
        ru: { title: "Новая {ver} доступна", free: "Ваша годовая поддержка включает это обновление бесплатно.", major: "Ваша годовая поддержка включает это крупное обновление бесплатно.", offer: "Ваш суверенитет защищён, но если вы хотите новые функции — предлагаем скидку в знак благодарности за поддержку.", postpone: "Отложить", download: "Скачать" },
        zh: { title: "{ver} 现已发布", free: "您的年度更新保障包含此免费更新。", major: "您的年度更新保障包含此重大升级。", offer: "您的主权已受保障，但若您希望获得新功能，我们为支持我们的您提供折扣。", postpone: "稍后提醒", download: "立即下载" },
        ja: { title: "{ver} が利用可能", free: "年間保証により、このアップデートは無料です。", major: "年間保証により、このメジャーアップグレードは無料です。", offer: "あなたの主権はカバーされていますが、新機能をご希望の場合はサポートいただける方に割引を提供しています。", postpone: "後で", download: "ダウンロード" },
        ko: { title: "{ver} 사용 가능", free: "연간 보증으로 이 업데이트가 무료로 제공됩니다.", major: "연간 보증으로 이 메이저 업그레이드가 무료로 제공됩니다.", offer: "귀하의 주권은 보장되어 있지만, 새 기능을 원하신다면 지원해 주시는 분께 할인을 제공합니다.", postpone: "나중에", download: "다운로드" },
        pl: { title: "Nowa {ver} dostępna", free: "Roczna ochrona obejmuje tę aktualizację bezpłatnie.", major: "Roczna ochrona obejmuje to uaktualnienie bezpłatnie.", offer: "Twoja suwerenność jest objęta, ale jeśli chcesz nowych funkcji, oferujemy zniżkę za wsparcie.", postpone: "Odłóż", download: "Pobierz" },
        tr: { title: "{ver} hazır", free: "Yıllık paketiniz bu güncellemeyi ücretsiz içerir.", major: "Yıllık paketiniz bu ana yükseltmeyi ücretsiz içerir.", offer: "Egemenliğiniz kapsanmıştır, ancak yeni özellikler isterseniz desteğiniz için size bir indirim sunuyoruz.", postpone: "Ertele", download: "İndir" },
        sv: { title: "{ver} tillgänglig", free: "Ditt årliga skydd inkluderar denna uppdatering gratis.", major: "Ditt årliga skydd inkluderar denna uppgradering gratis.", offer: "Din suveränitet är täckt, men om du vill ha nya funktioner erbjuder vi en rabatt för ditt stöd.", postpone: "Senare", download: "Ladda ner" },
        uk: { title: "Нова {ver} доступна", free: "Ваша річна підтримка включає це оновлення безкоштовно.", major: "Ваша річна підтримка включає це велике оновлення безкоштовно.", offer: "Ваш суверенітет захищено, але якщо ви хочете нові функції — пропонуємо знижку на знак вдячності за підтримку.", postpone: "Відкласти", download: "Завантажити" },
        ar: { title: "{ver} متاح الآن", free: "تغطيتك السنوية تتضمن هذا التحديث مجاناً.", major: "تغطيتك السنوية تتضمن هذه الترقية الكبرى مجاناً.", offer: "سيادتك مؤمّنة، لكن إن أردت الميزات الجديدة نقدم لك خصمًا تقديرًا لدعمك.", postpone: "تأجيل", download: "تنزيل" },
        fa: { title: "{ver} در دسترس است", free: "پوشش سالانه شما شامل این به‌روزرسانی رایگان است.", major: "پوشش سالانه شامل این ارتقای عمده رایگان است.", offer: "حاکمیت شما پوشش داده شده، اما اگر ویژگی‌های جدید را می‌خواهید، به پاس حمایت‌تان تخفیف ارائه می‌دهیم.", postpone: "بعداً", download: "دانلود" },
        eo: { title: "Nova {ver} disponeblas", free: "Via jara kovrado inkluzivas ĉi tiun senpagan ĝisdatigon.", major: "Via jara kovrado inkluzivas ĉi tiun gravan ĝisdatigon senpage.", offer: "Via suvereneco estas kovrita, sed se vi volas la novajn funkciojn, ni oferas rabaton pro via subteno.", postpone: "Prokrasti", download: "Elŝuti" },
        vi: { title: "{ver} đã có sẵn", free: "Gói bảo hành năm của bạn bao gồm bản cập nhật miễn phí này.", major: "Gói bảo hành năm bao gồm bản nâng cấp lớn này miễn phí.", offer: "Quyền sở hữu của bạn đã được đảm bảo, nhưng nếu bạn muốn các tính năng mới, chúng tôi cung cấp chiết khấu để cảm ơn sự ủng hộ của bạn.", postpone: "Để sau", download: "Tải về" },
        uz: { title: "{ver} mavjud", free: "Yillik kafolatingiz bu yangilanishni bepul o'z ichiga oladi.", major: "Yillik kafolat bu katta yangilanishni bepul o'z ichiga oladi.", offer: "Suverenitatingiz qoplangan, lekin yangi funksiyalarni xohlasangiz, qo'llab-quvvatlash uchun chegirma taklif qilamiz.", postpone: "Keyinroq", download: "Yuklab olish" },
        kk: { title: "{ver} қолжетімді", free: "Жылдық кепілдік бұл жаңартуды тегін қамтиды.", major: "Жылдық кепілдік бұл үлкен жаңартуды тегін қамтиды.", offer: "Сіздің егемендігіңіз қамтылған, бірақ жаңа мүмкіндіктерді қаласаңыз, қолдауыңыз үшін жеңілдік ұсынамыз.", postpone: "Кейінге қалдыру", download: "Жүктеп алу" }
    };

    const bLoc = bannerI18n[lang] || bannerI18n['en'] || bannerI18n['es'];
    const targetVer = channelData.target_version || channelData.new_version || '';

    if (titleEl) {
        titleEl.innerText = bLoc.title.replace('{ver}', targetVer);
    }

    if (textEl) {
        if (status === 'UPDATE_AVAILABLE_FREE') {
            textEl.innerText = bLoc.free;
        } else if (status === 'MAJOR_UPDATE_FREE') {
            textEl.innerText = bLoc.major;
        } else if (status === 'UPGRADE_OFFER') {
            textEl.innerText = bLoc.offer;
        }
    }

    if (btnPostpone) {
        btnPostpone.innerText = bLoc.postpone;
    }

    if (btnDownload) {
        btnDownload.innerText = bLoc.download;
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

/**
 * El usuario decide posponer el aviso en esta sesión.
 */
function postponeUpdateNotice() {
    try {
        sessionStorage.setItem('talkme_update_postponed', 'true');
    } catch (e) { }

    const modal = document.getElementById('updateAlertModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

/**
 * El usuario decide descargar la actualización:
 * Cierra la alerta flotante, abre el modal de Ajustes, conmuta a Licencia y sitúa la tarjeta de descarga.
 */
function goToLicenseForUpdate() {
    // 1. Cerrar la alerta flotante
    postponeUpdateNotice();

    // 2. Abrir modal de ajustes si está cerrado
    const modal = document.getElementById('prelaunchSettingsModal');
    if (modal && modal.classList.contains('hidden')) {
        togglePrelaunchSettings();
    }

    // 3. Conmutar a la pestaña de licencia
    const licenseNavBtn = document.querySelector("#prelaunchSettingsModal .settings-nav .nav-item:nth-child(2)");
    if (typeof switchPrelaunchTab === 'function') {
        switchPrelaunchTab('prelaunch-tab-license', licenseNavBtn || { classList: { add: () => { }, remove: () => { } } });
    }

    // 4. Scroll suave directo al contenedor de versiones y actualizaciones
    setTimeout(() => {
        const updateBox = document.getElementById('license-version-updates-box');
        if (updateBox) {
            updateBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Efecto de halo visual para guiar el ojo del usuario
            updateBox.style.transition = 'border-color 0.4s ease, box-shadow 0.4s ease';
            updateBox.style.borderColor = '#10B981';
            updateBox.style.boxShadow = '0 0 24px rgba(16, 185, 129, 0.45)';
            setTimeout(() => {
                updateBox.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                updateBox.style.boxShadow = 'none';
            }, 3000);
        }
    }, 200);
}

// Escuchar cambios de conectividad en tiempo real (Ley de Murphy)
// Al reconectar, ejecutar sonda real antes de refrescar la UI.
window.addEventListener('online', async () => {
    try {
        await isReallyOnline();
        if (typeof renderVersionUpdatesChannel === 'function') {
            renderVersionUpdatesChannel(currentLang || 'es');
        }
    } catch (e) {
        console.warn("⚠️ Error actualizando estado de versiones tras reconexión:", e);
    }
});

// Al desconectar, marcamos offline inmediatamente sin necesidad de sonda.
window.addEventListener('offline', () => {
    _talkmeRealOnline = false;
    try {
        if (typeof renderVersionUpdatesChannel === 'function') {
            renderVersionUpdatesChannel(currentLang || 'es');
        }
    } catch (e) {
        console.warn("⚠️ Error actualizando estado de versiones tras desconexión:", e);
    }
});

function changeLanguage(lang, isStartup = false) {
    currentLang = lang;
    localStorage.setItem('talkme_lang', lang);
    document.getElementById('loginLangSelect').value = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            let val = translations[lang][key];
            if (key === 'title_register') {
                val = val.replace(/^[\uD800-\uDBFF][\uDC00-\uDFFF]\s*/, '').replace(/^🛸\s*/, '');
            }
            if (val.includes('<') && val.includes('>')) {
                el.innerHTML = val;
            } else {
                el.innerText = val;
            }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        let val = null;
        if (translations[lang] && translations[lang][key]) {
            val = translations[lang][key];
        } else if (translations['en'] && translations['en'][key]) {
            val = translations['en'][key];
        } else if (translations['es'] && translations['es'][key]) {
            val = translations['es'][key];
        }
        if (val) {
            el.setAttribute('title', val);
        }
    });

    document.title = lang === 'es' ? 'Talk-me Launchpad' : (lang === 'en' ? 'Talk-me Launchpad' : 'Talk-me Launchpad');

    const motorStatusEl = document.getElementById('motor-status');
    if (motorStatusEl) {
        if (motorStatusEl.style.color === 'rgb(0, 255, 136)' || motorStatusEl.style.color === '#00ff88') {
            motorStatusEl.innerText = translations[lang].btn_validate_active;
        } else {
            motorStatusEl.innerText = translations[lang].motor_status_val;
        }
    }

    // Update active integrated text
    updateActiveBadgeText(lang);

    // Update plan names with Equipos/PC/PCs correctly across 24 languages
    const labelTranslations = {
        es: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        en: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        eu: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        de: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        ar: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        ca: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        zh: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        ko: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        eo: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        fa: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        fr: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        gl: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        nl: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        it: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        ja: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        kk: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        pl: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        pt: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        ru: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        sv: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        tr: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        uk: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        uz: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' },
        vi: { freelance: 'FREELANCE', enterprise: 'ENTERPRISE' }
    };
    const mapLabels = labelTranslations[lang] || labelTranslations['es'];

    const stripeFreeLbl = document.getElementById('stripe-freelance-label');
    const stripeEntLbl = document.getElementById('stripe-enterprise-label');
    const settingsFreeLbl = document.getElementById('settings-freelance-label');
    const settingsEntLbl = document.getElementById('settings-enterprise-label');

    if (stripeFreeLbl) stripeFreeLbl.innerText = mapLabels.freelance;
    if (stripeEntLbl) stripeEntLbl.innerText = mapLabels.enterprise;
    if (settingsFreeLbl) settingsFreeLbl.innerText = mapLabels.freelance;
    if (settingsEntLbl) settingsEntLbl.innerText = mapLabels.enterprise;

    // Format and update pricing dynamically for plan cards
    const freelanceRtoFee = formatCurrency(9.99, lang);
    const enterpriseRtoFee = formatCurrency(49.90, lang);
    const freelanceOtPrice = formatCurrency(139.89, lang);
    const enterpriseOtPrice = formatCurrency(698.60, lang);

    const suffixMo = lang === 'en' ? 'mo' : (lang === 'es' ? 'mes' : (lang === 'eu' ? 'hil' : 'mes'));

    document.querySelectorAll('.freelance-one-time-price').forEach(el => el.innerText = freelanceOtPrice);
    document.querySelectorAll('.enterprise-one-time-price').forEach(el => el.innerText = enterpriseOtPrice);
    document.querySelectorAll('.freelance-rto-price').forEach(el => el.innerText = `${freelanceRtoFee}/${suffixMo}`);
    document.querySelectorAll('.enterprise-rto-price').forEach(el => el.innerText = `${enterpriseRtoFee}/${suffixMo}`);

    const descTemplate = (translations[lang] && translations[lang].desc_rto_template) || "Pago mensual 14 cuotas.<br>Después vitalicia.";
    document.querySelectorAll('.freelance-rto-desc').forEach(el => el.innerHTML = descTemplate);
    document.querySelectorAll('.enterprise-rto-desc').forEach(el => el.innerHTML = descTemplate);

    // Update terms checkbox text dynamically
    const termsCombinedEl = document.getElementById('reg-terms-text');
    if (termsCombinedEl) {
        const t = translations[lang] || translations['es'];
        const prefix = t.terms_prefix || "He leído y acepto los";
        const uso = t.terms_link_uso || "términos de uso";
        const and = t.terms_and || "y las";
        const licencia = t.terms_link_licencia || "condiciones de licencia";
        termsCombinedEl.innerText = `${prefix} ${uso} ${and} ${licencia}.`;
    }

    updateExpiryDisplay(lang);
    checkPrelaunchTabModels();

    // Descarga del motor de voz mediante la función oficial probada
    if (window.speechModelDownloadTimeout) {
        clearTimeout(window.speechModelDownloadTimeout);
    }
    window.speechModelDownloadTimeout = null;

    if (isStartup) {
        downloadModel(lang);
    } else {
        const secRtoActive = document.getElementById('sec-rto-renewal');
        const isRtoVisible = secRtoActive && secRtoActive.style.display !== 'none';
        if (isRtoVisible && typeof _currentRtoDetails === 'object' && _currentRtoDetails !== null) {
            showRtoRenewalScreen(_currentRtoDetails);
            const panel = document.getElementById('status-panel');
            if (panel) panel.innerHTML = '';
            const t = translations[lang] || translations['es'] || {};
            const rtoErr = getLocalizedApiError('', 'RTO_PAYMENT_REQUIRED');
            logStatus((t.log_validation_error || "Error Soberanía: {error}").replace('{error}', rtoErr), 'error');
        } else {
            const verifyLangs = {
                es: "Verificando idioma...",
                en: "Verifying language...",
                eu: "Hizkuntza egiaztatzen...",
                de: "Sprache wird überprüft...",
                fr: "Vérification de la langue...",
                it: "Verifica della lingua...",
                pt: "Verificando idioma...",
                ca: "Verificant idioma...",
                gl: "Verificando idioma...",
                ru: "Проверка языка...",
                zh: "正在验证语言...",
                ja: "言語を確認しています...",
                ko: "언어 확인 중...",
                nl: "Taal verifiëren...",
                pl: "Weryfikowanie języka...",
                tr: "Dil doğrulanıyor...",
                uk: "Перевірка мови...",
                ar: "جاري التحقق من اللغة...",
                fa: "در حال بررسی زبان...",
                eo: "Verifikante lingvon...",
                sv: "Verifierar språk...",
                vi: "Đang xác minh ngôn ngữ...",
                uz: "Til tekshirilmoqda...",
                kk: "Тіл тексерілуде..."
            };
            const downloadLangs = {
                es: "Descargando...",
                en: "Downloading...",
                eu: "Deskargatzen...",
                de: "Herunterladen...",
                fr: "Téléchargement...",
                it: "Download...",
                pt: "Baixando...",
                ca: "Descarregant...",
                gl: "Descargando...",
                ru: "Скачивание...",
                zh: "正在下载...",
                ja: "ダウンロード中...",
                ko: "다운로드 중...",
                nl: "Downloaden...",
                pl: "Pobieranie...",
                tr: "İndiriliyor...",
                uk: "Завантаження...",
                ar: "جاري التحميل...",
                fa: "در حال دانلود...",
                eo: "Elŝutante...",
                sv: "Laddar ner...",
                vi: "Đang tải xuống...",
                uz: "Yuklab olinmoqda...",
                kk: "Жүктелуде..."
            };

            const vText = verifyLangs[lang] || verifyLangs['en'] || "Verificando idioma...";
            const dText = downloadLangs[lang] || downloadLangs['en'] || "Descargando...";

            logStatus(vText, 'success');
            logStatus(dText, 'success');

            window.speechModelDownloadTimeout = setTimeout(() => {
                downloadModel(lang);
            }, 10000);
        }
    }

    // Re-renderizar modal de bienvenida Trial si está visible al cambiar de idioma
    const modalTrial = document.getElementById('modalTrialWelcome');
    if (modalTrial && modalTrial.style.display !== 'none' && typeof showTrialWelcomeModal === 'function') {
        showTrialWelcomeModal(window._currentTrialWelcomeData || null);
    }

    // Carga de guía dinámica en 24 idiomas
    if (typeof loadPrelaunchGuide === 'function') {
        loadPrelaunchGuide(lang);
    }

    // Carga de sección legal dinámica en 24 idiomas
    if (typeof loadPrelaunchLegal === 'function') {
        loadPrelaunchLegal(lang);
    }

    // Refrescar canal de actualizaciones y banner en el nuevo idioma
    if (typeof renderVersionUpdatesChannel === 'function') {
        renderVersionUpdatesChannel(lang);
    }
}

function updateActiveBadgeText(lang) {
    const activeTextEl = document.getElementById('license-active-text');
    if (!activeTextEl) return;

    const status = localStorage.getItem('talkme_license_status') || 'active';
    if (status === 'trial') {
        const trialBadgeTranslations = {
            es: 'PRUEBA GRATUITA',
            en: 'FREE TRIAL',
            eu: 'DOAKO PROBA',
            de: 'KOSTENLOSE TESTVERSION',
            ar: 'نسخة تجريبية مجانية',
            ca: 'PROVA GRATUÏTA',
            zh: '免费试用',
            ko: '무료 평가판',
            eo: 'SENPAGA PROBO',
            fa: 'نسخه آزمایشی رایگان',
            fr: 'ESSAI GRATUIT',
            gl: 'PROBA DE BALDE',
            nl: 'GRATIS PROEFVERSIE',
            it: 'PROVA GRATUITA',
            ja: '無料体験',
            kk: 'ТЕГІН СЫНАҚ',
            pl: 'BEZPŁATNY OKRES PRÓBNY',
            pt: 'TESTE GRATUITO',
            ru: 'БЕСПЛАТНАЯ ВЕРСИЯ',
            sv: 'GRATIS PROVPERIOD',
            tr: 'ÜCRETSİZ DENEME',
            uk: 'БЕЗКОШТОВНА ВЕРСІЯ',
            uz: 'BEPUL SINOV',
            vi: 'DÙNG THỬ MIỄN PHÍ'
        };
        activeTextEl.innerText = trialBadgeTranslations[lang] || trialBadgeTranslations['es'];
        return;
    }

    const planType = localStorage.getItem('talkme_plan_type') || 'freelance';
    const paymentMode = localStorage.getItem('talkme_payment_mode');
    const isEnterprise = planType === 'enterprise';

    if (paymentMode === 'one_time') {
        const lifetimeTranslations = {
            es: { freelance: 'FREELANCE VITALICIA', enterprise: 'ENTERPRISE VITALICIA' },
            en: { freelance: 'FREELANCE LIFETIME', enterprise: 'ENTERPRISE LIFETIME' },
            eu: { freelance: 'FREELANCE BETIKO', enterprise: 'ENTERPRISE BETIKO' },
            de: { freelance: 'FREELANCE LEBENSLANG', enterprise: 'ENTERPRISE LEBENSLANG' },
            ar: { freelance: 'FREELANCE مدى الحياة', enterprise: 'ENTERPRISE مدى الحياة' },
            ca: { freelance: 'FREELANCE VITALÍCIA', enterprise: 'ENTERPRISE VITALÍCIA' },
            zh: { freelance: 'FREELANCE 终身', enterprise: 'ENTERPRISE 终身' },
            ko: { freelance: 'FREELANCE 평생', enterprise: 'ENTERPRISE 평생' },
            eo: { freelance: 'FREELANCE DUMVIVA', enterprise: 'ENTERPRISE DUMVIVA' },
            fa: { freelance: 'FREELANCE مادام‌العمر', enterprise: 'ENTERPRISE مادام‌العمر' },
            fr: { freelance: 'FREELANCE À VIE', enterprise: 'ENTERPRISE À VIE' },
            gl: { freelance: 'FREELANCE VITALICIA', enterprise: 'ENTERPRISE VITALICIA' },
            nl: { freelance: 'FREELANCE LEVENSLANG', enterprise: 'ENTERPRISE LEVENSLANG' },
            it: { freelance: 'FREELANCE A VITA', enterprise: 'ENTERPRISE A VITA' },
            ja: { freelance: 'FREELANCE 永久', enterprise: 'ENTERPRISE 永久' },
            kk: { freelance: 'FREELANCE ӨМІРЛІК', enterprise: 'ENTERPRISE ӨМІРЛІК' },
            pl: { freelance: 'FREELANCE WIECZYSTA', enterprise: 'ENTERPRISE WIECZYSTA' },
            pt: { freelance: 'FREELANCE VITALÍCIA', enterprise: 'ENTERPRISE VITALÍCIA' },
            ru: { freelance: 'FREELANCE БЕССРОЧНАЯ', enterprise: 'ENTERPRISE БЕССРОЧНАЯ' },
            sv: { freelance: 'FREELANCE LIVSTID', enterprise: 'ENTERPRISE LIVSTID' },
            tr: { freelance: 'FREELANCE ÖMÜR BOYU', enterprise: 'ENTERPRISE ÖMÜR BOYU' },
            uk: { freelance: 'FREELANCE БЕЗСТРОКОВА', enterprise: 'ENTERPRISE БЕЗСТРОКОВА' },
            uz: { freelance: 'FREELANCE UMRBOD', enterprise: 'ENTERPRISE UMRBOD' },
            vi: { freelance: 'FREELANCE TRỌN ĐỜI', enterprise: 'ENTERPRISE TRỌN ĐỜI' }
        };
        const map = lifetimeTranslations[lang] || lifetimeTranslations['es'];
        activeTextEl.innerText = isEnterprise ? map.enterprise : map.freelance;
    } else {
        const translationKey = isEnterprise ? 'plan_active_enterprise' : 'plan_active_freelance';
        activeTextEl.innerText = (translations[lang] && translations[lang][translationKey])
            ? translations[lang][translationKey]
            : (isEnterprise ? 'ENTERPRISE ACTIVA' : 'FREELANCE ACTIVA');
    }
}

function logStatus(msg, statusType = 'success') {
    const panel = document.getElementById('status-panel');
    if (!panel) return;
    // Mostrar la consola automáticamente en cuanto hay actividad real
    panel.style.display = 'block';
    const colorClass = statusType === 'error' ? 'error' : (statusType === 'warning' ? 'warning' : 'success');
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `[${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
    const entryHtml = `<div class="status-entry ${colorClass}"><span class="status-time">${timeStr}</span><span class="status-msg">${msg}</span></div>`;
    panel.innerHTML = entryHtml + panel.innerHTML;
}

function showRegister(show) {
    document.getElementById('sec-login').style.display = show ? 'none' : 'block';
    document.getElementById('sec-register').style.display = show ? 'block' : 'none';
    // Ocultar la consola solo en la pantalla de registrarse, y mostrarla en la de iniciar sesión
    const panel = document.getElementById('status-panel');
    if (panel) {
        panel.style.display = show ? 'none' : 'block';
    }
}

window.onload = async () => {
    await syncDefaultModelsPathFromServer();
    if (typeof initStarfield !== 'undefined') {
        initStarfield();
    }

    const prelaunchModal = document.getElementById('prelaunchSettingsModal');
    if (prelaunchModal) {
        prelaunchModal.addEventListener('click', (e) => {
            if (e.target === prelaunchModal) {
                togglePrelaunchSettings();
            }
        });
    }

    let defaultLang = localStorage.getItem('talkme_lang');
    if (!defaultLang) {
        const sysLang = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
        if (sysLang.startsWith('en')) {
            defaultLang = 'en';
        } else if (sysLang.startsWith('eu')) {
            defaultLang = 'eu';
        } else {
            defaultLang = 'es';
        }
    }
    changeLanguage(defaultLang, true);
    fetchPricingAndVersionChannel();

    // Descarga silenciosa en segundo plano del motor de traducción al abrir la aplicación
    startBackgroundTranslateDownload();

    const urlParams = new URLSearchParams(window.location.search);
    const extLandingDict = {
        es: {
            titleSuccess: "¡Pago Completado con Éxito!",
            descSuccess: "Tu licencia ha sido activada correctamente. Ya puedes cerrar esta pestaña del navegador y regresar a la aplicación de escritorio de <strong>Talk-me</strong>, la cual se activará automáticamente para que puedas continuar.",
            btnSuccess: "Cerrar pestaña",
            titleCancel: "Pago Cancelado",
            descCancel: "El proceso de pago de la licencia ha sido cancelado. Ya puedes cerrar esta pestaña y volver a intentarlo desde la aplicación de escritorio de <strong>Talk-me</strong>.",
            btnCancel: "Cerrar pestaña"
        },
        en: {
            titleSuccess: "Payment Completed Successfully!",
            descSuccess: "Your license has been activated successfully. You can now close this browser tab and return to the <strong>Talk-me</strong> desktop app, which will automatically activate so you can continue.",
            btnSuccess: "Close tab",
            titleCancel: "Payment Canceled",
            descCancel: "The license payment process has been canceled. You can now close this tab and try again from the <strong>Talk-me</strong> desktop app.",
            btnCancel: "Close tab"
        },
        ca: {
            titleSuccess: "Pagament Completat amb Èxit!",
            descSuccess: "La teva llicència s'ha activat correctament. Ja pots tancar aquesta pestanya del navegador i tornar a l'aplicació de sobretaula de <strong>Talk-me</strong>, la qual s'activarà automàticament per a continuar.",
            btnSuccess: "Tancar pestanya",
            titleCancel: "Pagament Cancel·lat",
            descCancel: "El procés de pagament de la llicència s'ha cancel·lat. Ja pots tancar aquesta pestanya i tornar-ho a intentar des de l'aplicació de sobretaula de <strong>Talk-me</strong>.",
            btnCancel: "Tancar pestanya"
        },
        eu: {
            titleSuccess: "Ordainketa Arrakastaz Burututa!",
            descSuccess: "Zure lizentzia behar bezala aktibatu da. Orain nabigatzaileko fitxa hau itxi eta <strong>Talk-me</strong> mahaigaineko aplikaziora itzul zaitezke, automatikoki aktibatuko baita jarrai dezazun.",
            btnSuccess: "Itxi fitxa",
            titleCancel: "Ordainketa Ezeztatua",
            descCancel: "Lizentziaren ordainketa prozesua ezeztatu da. Orain fitxa hau itxi eta berriro saia zaitezke <strong>Talk-me</strong> mahaigaineko aplikaziotik.",
            btnCancel: "Itxi fitxa"
        },
        gl: {
            titleSuccess: "Pago Completado con Éxito!",
            descSuccess: "A túa licencia foi activada correctamente. Xa podes pechar esta pestana do navegador e volver á aplicación de escritorio de <strong>Talk-me</strong>, a cal se activará automaticamente para continuar.",
            btnSuccess: "Pechar pestana",
            titleCancel: "Pago Cancelado",
            descCancel: "O proceso de pago da licencia foi cancelado. Xa podes pechar esta pestana e volver intentalo desde a aplicación de escritorio de <strong>Talk-me</strong>.",
            btnCancel: "Pechar pestana"
        },
        fr: {
            titleSuccess: "Paiement Effectué avec Succès !",
            descSuccess: "Votre licence a été activée avec succès. Vous pouvez maintenant fermer cet onglet et revenir à l'application de bureau <strong>Talk-me</strong>, qui s'activera automatiquement pour continuer.",
            btnSuccess: "Fermer l'onglet",
            titleCancel: "Paiement Annulé",
            descCancel: "Le processus de paiement de la licence a été annulé. Vous pouvez maintenant fermer cet onglet et réessayer depuis l'application de bureau <strong>Talk-me</strong>.",
            btnCancel: "Fermer l'onglet"
        },
        de: {
            titleSuccess: "Zahlung Erfolgreich Abgeschlossen!",
            descSuccess: "Ihre Lizenz wurde erfolgreich aktiviert. Sie können dieses Browser-Tab jetzt schließen und zur <strong>Talk-me</strong> Desktop-Anwendung zurückkehren, die sich automatisch aktiviert.",
            btnSuccess: "Tab schließen",
            titleCancel: "Zahlung Abgebrochen",
            descCancel: "Der Lizenzzahlungsvorgang wurde abgebrochen. Sie können diesen Tab jetzt schließen und es von der <strong>Talk-me</strong> Desktop-Anwendung aus erneut versuchen.",
            btnCancel: "Tab schließen"
        },
        it: {
            titleSuccess: "Pagamento Completato con Successo!",
            descSuccess: "La tua licenza è stata attivata con successo. Ora puoi chiudere questa scheda del browser e tornare all'applicazione desktop <strong>Talk-me</strong>, che si attiverà automaticamente.",
            btnSuccess: "Chiudi scheda",
            titleCancel: "Pagamento Annullato",
            descCancel: "Il processo di pagamento della licenza è stato annullato. Ora puoi chiudere questa scheda e riprovare dall'applicazione desktop <strong>Talk-me</strong>.",
            btnCancel: "Chiudi scheda"
        },
        pt: {
            titleSuccess: "Pagamento Concluído com Sucesso!",
            descSuccess: "A sua licença foi ativada com sucesso. Já pode fechar este separador do navegador e voltar à aplicação de ambiente de trabalho <strong>Talk-me</strong>, que será ativada automaticamente.",
            btnSuccess: "Fechar separador",
            titleCancel: "Pagamento Cancelado",
            descCancel: "O processo de pagamento da licença foi cancelado. Já pode fechar este separador e tentar novamente a partir da aplicação de ambiente de trabalho <strong>Talk-me</strong>.",
            btnCancel: "Fechar separador"
        },
        nl: {
            titleSuccess: "Betaling Succesvol Voltooid!",
            descSuccess: "Uw licentie is succesvol geactiveerd. U kunt dit tabblad nu sluiten en terugkeren naar de <strong>Talk-me</strong> desktop-app, die automatisch wordt geactiveerd.",
            btnSuccess: "Tabblad sluiten",
            titleCancel: "Betaling Geannuleerd",
            descCancel: "Het licentiebetalingsproces is geannuleerd. U kunt dit tabblad nu sluiten en het opnieuw proberen vanuit de <strong>Talk-me</strong> desktop-app.",
            btnCancel: "Tabblad sluiten"
        },
        pl: {
            titleSuccess: "Płatność Zakończona Sukcesem!",
            descSuccess: "Twoja licencja została pomyślnie aktywowana. Możesz teraz zamknąć tę kartę przeglądarki i wrócić do aplikacji stacjonarnej <strong>Talk-me</strong>, która aktywuje się automatycznie.",
            btnSuccess: "Zamknij kartę",
            titleCancel: "Płatność Anulowana",
            descCancel: "Proces płatności za licencję został anulowany. Możesz teraz zamknąć tę kartę i spróbować ponownie z poziomu aplikacji stacjonarnej <strong>Talk-me</strong>.",
            btnCancel: "Zamknij kartę"
        },
        ru: {
            titleSuccess: "Оплата Успешно Завершена!",
            descSuccess: "Ваша лицензия успешно активирована. Теперь вы можете закрыть эту вкладку браузера и вернуться в десктопное приложение <strong>Talk-me</strong>, которое автоматически активируется.",
            btnSuccess: "Закрыть вкладку",
            titleCancel: "Оплата Отменена",
            descCancel: "Процесс оплаты лицензии был отменен. Теперь вы можете закрыть эту вкладку и попробовать снова из десктопного приложения <strong>Talk-me</strong>.",
            btnCancel: "Закрыть вкладку"
        },
        uk: {
            titleSuccess: "Оплату Успішно Завершено!",
            descSuccess: "Вашу ліцензію успішно активовано. Тепер ви можете закрити цю вкладку браузера та повернутися до настільного додатка <strong>Talk-me</strong>, який автоматично активується.",
            btnSuccess: "Закрити вкладку",
            titleCancel: "Оплату Скасовано",
            descCancel: "Процес оплати ліцензії скасовано. Тепер ви можете закрити цю вкладку та спробувати знову з настільного додатка <strong>Talk-me</strong>.",
            btnCancel: "Закрити вкладку"
        },
        ar: {
            titleSuccess: "تم الدفع بنجاح!",
            descSuccess: "تم تفعيل ترخيصك بنجاح. يمكنك الآن إغلاق تبويب المتصفح هذا والعودة إلى تطبيق سطح المكتب <strong>Talk-me</strong> الذي سيتم تفعيله تلقائيًا.",
            btnSuccess: "إغلاق التبويب",
            titleCancel: "تم إلغاء الدفع",
            descCancel: "تم إلغاء عملية دفع الترخيص. يمكنك الآن إغلاق هذا التبويب والمحاولة مرة أخرى من تطبيق سطح المكتب <strong>Talk-me</strong>.",
            btnCancel: "إغلاق التبويب"
        },
        zh: {
            titleSuccess: "支付成功完成！",
            descSuccess: "您的许可证已成功激活。您现在可以关闭此浏览器标签页并返回 <strong>Talk-me</strong> 桌面应用程序，该程序将自动激活以便您继续使用。",
            btnSuccess: "关闭标签页",
            titleCancel: "支付已取消",
            descCancel: "许可证支付流程已取消。您现在可以关闭此标签页并从 <strong>Talk-me</strong> 桌面应用程序重试。",
            btnCancel: "关闭标签页"
        },
        ja: {
            titleSuccess: "お支払いが正常に完了しました！",
            descSuccess: "ライセンスが正常に有効化されました。このブラウザタブを閉じて <strong>Talk-me</strong> デスクトップアプリに戻ることができます。アプリは自動的に有効化されます。",
            btnSuccess: "タブを閉じる",
            titleCancel: "お支払いがキャンセルされました",
            descCancel: "ライセンスの支払いがキャンセルされました。このタブを閉じて、<strong>Talk-me</strong> デスクトップアプリから再試行できます。",
            btnCancel: "タブを閉じる"
        },
        ko: {
            titleSuccess: "결제가 성공적으로 완료되었습니다!",
            descSuccess: "라이선스가 성공적으로 활성화되었습니다. 이제 이 브라우저 탭을 닫고 <strong>Talk-me</strong> 데스크톱 앱으로 돌아가실 수 있으며, 앱이 자동으로 활성화됩니다.",
            btnSuccess: "탭 닫기",
            titleCancel: "결제가 취소되었습니다",
            descCancel: "라이선스 결제 프로세스가 취소되었습니다. 이제 이 탭을 닫고 <strong>Talk-me</strong> 데스크톱 앱에서 다시 시도하실 수 있습니다.",
            btnCancel: "탭 닫기"
        },
        tr: {
            titleSuccess: "Ödeme Başarıyla Tamamlandı!",
            descSuccess: "Lisansınız başarıyla etkinleştirildi. Artık bu tarayıcı sekmesini kapatıp otomatik olarak etkinleştirilecek olan <strong>Talk-me</strong> masaüstü uygulamasına dönebilirsiniz.",
            btnSuccess: "Sekmeyi kapat",
            titleCancel: "Ödeme İptal Edildi",
            descCancel: "Lisans ödeme işlemi iptal edildi. Artık bu sekmeyi kapatıp <strong>Talk-me</strong> masaüstü uygulamasından tekrar deneyebilirsiniz.",
            btnCancel: "Sekmeyi kapat"
        },
        sv: {
            titleSuccess: "Betalningen Har Slutförts!",
            descSuccess: "Ditt licens har aktiverats. Du kan nu stänga denna webbläsarflik och återvända till <strong>Talk-me</strong> skrivbordsappen, som aktiveras automatiskt.",
            btnSuccess: "Stäng flik",
            titleCancel: "Betalning Avbruten",
            descCancel: "Licensbetalningen avbröts. Du kan nu stänga denna flik och försöka igen från <strong>Talk-me</strong> skrivbordsappen.",
            btnCancel: "Stäng flik"
        },
        vi: {
            titleSuccess: "Thanh Toán Thành Công!",
            descSuccess: "Giấy phép của bạn đã được kích hoạt thành công. Bây giờ bạn có thể đóng thẻ trình duyệt này và quay lại ứng dụng máy tính <strong>Talk-me</strong>, ứng dụng sẽ tự động kích hoạt.",
            btnSuccess: "Đóng thẻ",
            titleCancel: "Thanh Toán Đã Hủy",
            descCancel: "Quy trình thanh toán giấy phép đã bị hủy. Bây giờ bạn có thể đóng thẻ này và thử lại từ ứng dụng máy tính <strong>Talk-me</strong>.",
            btnCancel: "Đóng thẻ"
        },
        eo: {
            titleSuccess: "Pago Sukcese Kompletita!",
            descSuccess: "Via licenco estis sukcese aktivigita. Vi nun povas fermi ĉi tiun retumilan langeton kaj reveni al la labortabla aplikaĵo <strong>Talk-me</strong>, kiu aŭtomate aktiviĝos.",
            btnSuccess: "Fermi langeton",
            titleCancel: "Pago Nuligita",
            descCancel: "La procezo de licenca pago estis nuligita. Vi nun povas fermi ĉi tiun langeton kaj relonĉi de la labortabla aplikaĵo <strong>Talk-me</strong>.",
            btnCancel: "Fermi langeton"
        },
        fa: {
            titleSuccess: "پرداخت با موفقیت انجام شد!",
            descSuccess: "مجوز شما با موفقیت فعال شد. اکنون می‌توانید این تب مرورگر را ببندید و به برنامه دسکتاپ <strong>Talk-me</strong> بازگردید که به طور خودکار فعال می‌شود.",
            btnSuccess: "بستن تب",
            titleCancel: "پرداخت لغو شد",
            descCancel: "فرآیند پرداخت مجوز لغو شد. اکنون می‌توانید این تب را ببندید و از برنامه دسکتاپ <strong>Talk-me</strong> دوباره امتحان کنید.",
            btnCancel: "بستن تب"
        },
        kk: {
            titleSuccess: "Төлем Сәтті Аяқталды!",
            descSuccess: "Лицензияңыз сәтті белсендірілді. Енді осы шолғыш қойындысын жауып, автоматты түрде белсендірілетін <strong>Talk-me</strong> жұмыс үстелі қолданбасына оралуыңызға болады.",
            btnSuccess: "Қойындыны жабу",
            titleCancel: "Төлем Тоқтатылды",
            descCancel: "Лицензия төлеу процесі тоқтатылды. Енді осы қойындыны жауып, <strong>Talk-me</strong> жұмыс үстелі қолданбасынан қайта байқауға болады.",
            btnCancel: "Қойындыны жабу"
        },
        uz: {
            titleSuccess: "To'lov Muvaffaqiyatli Bajarildi!",
            descSuccess: "Litsenziyangiz muvaffaqiyatli faollashtirildi. Endi ushbu brauzer varag'ini yopishingiz va avtomatik ravishda faollashadigan <strong>Talk-me</strong> ish stoli ilovasiga qaytishingiz mumkin.",
            btnSuccess: "Varaqni yopish",
            titleCancel: "To'lov Bekor Qilindi",
            descCancel: "Litsenziya to'lov jarayoni bekor qilindi. Endi ushbu varaqni yopishingiz va <strong>Talk-me</strong> ish stoli ilovasidan qayta urinib ko'rishingiz mumkin.",
            btnCancel: "Varaqni yopish"
        }
    };

    const activeLang = urlParams.get('lang') || localStorage.getItem('talkme_lang') || (navigator.language || 'es').slice(0, 2).toLowerCase();
    const l10n = extLandingDict[activeLang] || extLandingDict['es'];

    // Define global helper for closing browser tabs cleanly with UI feedback
    window.closeBrowserTab = function (btnElement) {
        try { window.close(); } catch (e) { }
        try { window.open('', '_self', '').close(); } catch (e) { }
        setTimeout(() => {
            // Si la pestaña sigue abierta (ej. si el navegador bloqueó window.close() o el usuario está probando en local sin Electron):
            // Si hay más historial en la misma pestaña o es la propia pestaña de localhost:3000, limpiamos ?canceled=true / ?success=true
            // y regresamos automáticamente al Launchpad para que no se quede clavado en el cartel de "Pestaña lista para cerrar".
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.')) {
                window.location.href = window.location.origin + '/';
                return;
            }
            if (btnElement) {
                btnElement.disabled = true;
                btnElement.style.opacity = '0.9';
                btnElement.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                btnElement.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                const lang = urlParams.get('lang') || currentLang || 'es';
                const closedMsg = {
                    es: "✔ Pestaña lista para cerrar. Regresa a Talk-me",
                    en: "✔ Tab ready to close. Return to Talk-me",
                    ca: "✔ Pestanya a punt per tancar. Torna a Talk-me",
                    eu: "✔ Fitxa itxita prest. Itzuli Talk-me-ra",
                    gl: "✔ Pestana lista para pechar. Volve a Talk-me",
                    fr: "✔ Onglet prêt à être fermé. Retournez à Talk-me",
                    de: "✔ Tab bereit zum Schließen. Zurück zu Talk-me",
                    it: "✔ Scheda pronta per la chiusura. Torna a Talk-me",
                    pt: "✔ Separador pronto a fechar. Volte ao Talk-me",
                    nl: "✔ Tabblad gereed om te sluiten. Keer terug naar Talk-me",
                    pl: "✔ Karta gotowa do zamknięcia. Wróć do Talk-me",
                    ru: "✔ Вкладка готова к закрытию. Вернитесь в Talk-me",
                    uk: "✔ Вкладку готово до закриття. Поверніться до Talk-me",
                    ar: "✔ التبويب جاهز للإغلاق. عد إلى Talk-me",
                    zh: "✔ 标签页已准备好关闭。请返回 Talk-me",
                    ja: "✔ タブを閉じる準備ができました。Talk-me に戻ってください",
                    ko: "✔ 탭을 닫을 준비가 되었습니다. Talk-me로 돌아가세요",
                    tr: "✔ Sekme kapatılmaya hazır. Talk-me'ye dönün",
                    sv: "✔ Fliken klar att stängas. Återvänd till Talk-me",
                    vi: "✔ Thẻ đã sẵn sàng đóng. Quay lại Talk-me",
                    eo: "✔ Langeto preta por fermi. Revenu al Talk-me",
                    fa: "✔ تب آماده بستن است. به Talk-me بازگردید",
                    kk: "✔ Қойынды жабылуға дайын. Talk-me-ге оралыңыз",
                    uz: "✔ Varaq yopilishga tayyor. Talk-me-ga qayting"
                };
                btnElement.innerHTML = closedMsg[lang] || closedMsg['en'] || closedMsg['es'];
            }
        }, 250);
    };

    if (urlParams.get('success') === 'true') {
        const sessionId = urlParams.get('session_id');
        const userId = urlParams.get('user_id');
        const isElectron = navigator.userAgent.toLowerCase().includes('electron');

        if (!isElectron) {
            document.body.style.backgroundColor = '#000000';
            document.body.style.margin = '0';
            document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background-color: #000000; color: #fff; font-family: 'Outfit', 'Inter', sans-serif; text-align: center; padding: 20px; box-sizing: border-box; margin: 0;">
                    <div style="background: #0d0c16; border: 1px solid rgba(123, 104, 238, 0.3); border-radius: 20px; padding: 40px 30px; max-width: 480px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9); width: 100%;">
                        <div style="margin-bottom: 20px; display: inline-flex; justify-content: center; animation: pulse 2s infinite;">
                            <svg class="anim-party-stage" viewBox="0 0 36 36" width="68" height="68" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" style="filter: drop-shadow(0 6px 18px rgba(123, 104, 238, 0.45));">
                                <defs>
                                    <linearGradient id="tmConeGradSuccess" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#8B78FF" />
                                        <stop offset="100%" stop-color="#5E4AE3" />
                                    </linearGradient>
                                    <linearGradient id="tmOrangeGradSuccess" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#FF8552" />
                                        <stop offset="100%" stop-color="#FF5722" />
                                    </linearGradient>
                                    <clipPath id="tmConeClipSuccess">
                                        <path d="M4.2 29.8 C3.3 30.2 2.8 29.7 3.2 28.8 L12.4 9.6 L23.4 20.6 Z" />
                                    </clipPath>
                                </defs>
                                <g class="party-popper-gun">
                                    <g clip-path="url(#tmConeClipSuccess)">
                                        <path d="M2 31 L12.4 9.6 L23.4 20.6 Z" fill="url(#tmConeGradSuccess)" />
                                        <path d="M5.5 23.5 L15.5 27.5 L13.2 31.5 L3.2 27.5 Z" fill="url(#tmOrangeGradSuccess)" />
                                        <path d="M8.8 16.5 L21.5 21.5 L19.2 25.2 L6.8 20.2 Z" fill="#B2A8FF" opacity="0.45" />
                                        <path d="M10.2 13.5 L23.5 18.8 L21.8 21.8 L8.5 16.5 Z" fill="url(#tmOrangeGradSuccess)" />
                                    </g>
                                    <path d="M4.2 29.8 C3.3 30.2 2.8 29.7 3.2 28.8 L12.4 9.6 L23.4 20.6 Z" fill="none" stroke="#1E1B36" stroke-width="1.2" stroke-linejoin="round" />
                                    <ellipse cx="17.9" cy="15.1" rx="7.6" ry="3.4" transform="rotate(45 17.9 15.1)" fill="#141126" stroke="#7B68EE" stroke-width="1.3" />
                                </g>
                                <g class="streamer-purple">
                                    <path d="M16.8 13.8 C15.2 10.5 19.8 9.2 18.2 6.0 C17.2 4.0 19.5 2.5 21.2 2.2" fill="none" stroke="#10B981" stroke-width="2.3" stroke-linecap="round" />
                                    <path d="M13.5 6.8 L14.8 4.2" fill="none" stroke="#FF6B35" stroke-width="2.2" stroke-linecap="round" />
                                </g>
                                <g class="streamer-orange">
                                    <path d="M19.5 16.2 C22.8 14.5 24.2 19.0 27.5 17.4 C29.5 16.4 31.2 18.2 31.8 19.8" fill="none" stroke="#FF6B35" stroke-width="2.3" stroke-linecap="round" />
                                    <path d="M25.5 11.2 C27.8 9.5 30.2 11.5 32.2 9.8" fill="none" stroke="#8B78FF" stroke-width="2.2" stroke-linecap="round" />
                                </g>
                                <g class="confetti-layer-1">
                                    <circle cx="22.5" cy="7.5" r="1.6" fill="#FF6B35" />
                                    <circle cx="27.2" cy="5.2" r="1.4" fill="#10B981" />
                                    <circle cx="16.2" cy="9.2" r="1.3" fill="#FFFFFF" />
                                </g>
                                <g class="confetti-layer-2">
                                    <circle cx="23.8" cy="13.2" r="1.5" fill="#FFFFFF" />
                                    <circle cx="30.5" cy="14.5" r="1.6" fill="#10B981" />
                                    <circle cx="26.8" cy="22.2" r="1.5" fill="#7B68EE" />
                                </g>
                            </svg>
                        </div>
                        <h1 id="landing-title" style="font-size: 24px; font-weight: 800; margin: 0 0 16px 0; background: linear-gradient(135deg, #ffffff 0%, #b2a8ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px;">${l10n.titleSuccess}</h1>
                        <p id="landing-desc" style="font-size: 15px; color: #aaaaaa; line-height: 1.6; margin: 0 0 32px 0;">${l10n.descSuccess}</p>
                        <button id="landing-btn" onclick="closeBrowserTab(this)" style="background: #7B68EE; color: #fff; border: none; padding: 14px 28px; font-size: 14px; font-weight: 700; border-radius: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(123, 104, 238, 0.3); width: 100%;" onmouseover="this.style.background='#6c5ce7'" onmouseout="this.style.background='#7B68EE'">${l10n.btnSuccess}</button>
                    </div>
                </div>
            `;

            // Notificar al servidor local y actualizar dinámicamente al idioma registrado del usuario en la BD
            if (sessionId) {
                fetch('/api/verify-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId, user_id: userId || 0, email: localStorage.getItem('talkme_email') || '' })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.lang && extLandingDict[data.lang]) {
                            const userL10n = extLandingDict[data.lang];
                            const tEl = document.getElementById('landing-title');
                            const dEl = document.getElementById('landing-desc');
                            const bEl = document.getElementById('landing-btn');
                            if (tEl) tEl.innerText = userL10n.titleSuccess;
                            if (dEl) dEl.innerHTML = userL10n.descSuccess;
                            if (bEl && !bEl.disabled) bEl.innerText = userL10n.btnSuccess;
                        }
                    })
                    .catch(err => console.warn("Background notification to local server:", err));
            }

            return;
        }
        await processStripeSuccess(sessionId, userId);
        return;
    }
    if (urlParams.get('canceled') === 'true') {
        const isElectron = navigator.userAgent.toLowerCase().includes('electron');
        if (!isElectron) {
            document.body.style.backgroundColor = '#000000';
            document.body.style.margin = '0';
            document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background-color: #000000; color: #fff; font-family: 'Outfit', 'Inter', sans-serif; text-align: center; padding: 20px; box-sizing: border-box; margin: 0;">
                    <div style="background: #140d0a; border: 1px solid rgba(255, 107, 53, 0.3); border-radius: 20px; padding: 40px 30px; max-width: 480px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9); width: 100%;">
                        <div style="font-size: 64px; margin-bottom: 24px;">❌</div>
                        <h1 style="font-size: 24px; font-weight: 800; margin: 0 0 16px 0; background: linear-gradient(135deg, #ffffff 0%, #ffaa85 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px;">${l10n.titleCancel}</h1>
                        <p style="font-size: 15px; color: #aaaaaa; line-height: 1.6; margin: 0 0 32px 0;">${l10n.descCancel}</p>
                        <button onclick="closeBrowserTab(this)" style="background: #ff6b35; color: #fff; border: none; padding: 14px 28px; font-size: 14px; font-weight: 700; border-radius: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3); width: 100%;" onmouseover="this.style.background='#ff5722'" onmouseout="this.style.background='#ff6b35'">${l10n.btnCancel}</button>
                    </div>
                </div>
            `;
            return;
        }
        logStatus(translations[currentLang].log_stripe_canceled || "❌ Pago cancelado por el usuario.", "error");
    }

    const cachedEmail = localStorage.getItem('talkme_email');
    const cachedLicense = localStorage.getItem('talkme_license');
    const sessionActive = localStorage.getItem('talkme_session_active') === 'true';

    // Clean up empty expiry date that may have been stored in previous sessions
    const storedExpiry = localStorage.getItem('talkme_license_expiry');
    if (storedExpiry === '' || storedExpiry === 'null') {
        localStorage.removeItem('talkme_license_expiry');
    }

    if (cachedEmail) {
        document.getElementById('log-email').value = cachedEmail;
    }

    // Asegurar que la pantalla por defecto sea Login salvo que haya una sesión activa confirmada
    document.getElementById('sec-login').style.display = 'block';
    document.getElementById('sec-stripe').style.display = 'none';
    document.getElementById('sec-validate').style.display = 'none';
    document.getElementById('sec-start-server').style.display = 'none';
    const secRtoInit = document.getElementById('sec-rto-renewal');
    if (secRtoInit) secRtoInit.style.display = 'none';
    const dashInit = document.querySelector('.dashboard');
    if (dashInit) dashInit.classList.remove('has-rto-renewal');

    // Ensure settings button is hidden by default until valid session is proven
    const btnInitialSettings = document.getElementById('btnOpenPrelaunchSettings');
    if (btnInitialSettings && !sessionActive) {
        btnInitialSettings.style.display = 'none';
    }

    // FAST PATH: session already validated — show UI instantly, validate online silently in background
    if (sessionActive && cachedEmail && cachedLicense) {
        document.getElementById('val-license').value = cachedLicense;
        document.getElementById('sec-login').style.display = 'none';
        document.getElementById('sec-validate').style.display = 'none';
        document.getElementById('sec-start-server').style.display = 'block';
        const headerActions = document.getElementById('globalLangSwitcher');
        if (headerActions) {
            headerActions.style.display = 'flex';
            headerActions.style.opacity = '1';
            headerActions.style.pointerEvents = 'auto';
        }
        const btnKeySettings = document.getElementById('btnOpenPrelaunchSettings');
        if (btnKeySettings) {
            btnKeySettings.style.display = 'flex';
            btnKeySettings.style.opacity = '1';
            btnKeySettings.style.pointerEvents = 'auto';
        }
        if (typeof updateSettingsButtonPulse === 'function') {
            updateSettingsButtonPulse();
        }
        if (typeof renderVersionUpdatesChannel === 'function') {
            renderVersionUpdatesChannel(currentLang || 'es');
        }
        checkAndPromptTranslateDownload();
        downloadModel(currentLang);
        // Background re-validation (non-blocking) — updates token and expiry silently
        performAutomaticValidation(cachedLicense, cachedEmail).then(ok => {
            if (ok === 'RTO_SCREEN') {
                localStorage.setItem('talkme_session_active', 'false');
                const btnKey = document.getElementById('btnOpenPrelaunchSettings');
                if (btnKey) btnKey.style.display = 'none';
            } else if (!ok) {
                // Solo si el servidor rechaza explícitamente la licencia se desactiva
                localStorage.setItem('talkme_session_active', 'false');
                const btnKey = document.getElementById('btnOpenPrelaunchSettings');
                if (btnKey) btnKey.style.display = 'none';
                document.getElementById('sec-login').style.display = 'block';
                document.getElementById('sec-start-server').style.display = 'none';
            }
        }).catch(() => { });
        return;
    }

    // SLOW PATH: no active session — validate synchronously and show login if needed
    if (cachedEmail && cachedLicense) {
        document.getElementById('val-license').value = cachedLicense;
        document.getElementById('sec-login').style.display = 'none';
        const success = await performAutomaticValidation(cachedLicense, cachedEmail);
        if (success === true) {
            localStorage.setItem('talkme_session_active', 'true');
            const btnKey = document.getElementById('btnOpenPrelaunchSettings');
            if (btnKey) {
                btnKey.style.display = 'flex';
                btnKey.style.opacity = '1';
                btnKey.style.pointerEvents = 'auto';
            }
            if (typeof updateSettingsButtonPulse === 'function') {
                updateSettingsButtonPulse();
            }
        } else if (success === 'RTO_SCREEN') {
            // [AJUSTE CONTEXTUAL]: Si el usuario está viendo la pantalla de cuota pendiente, desmarcamos talkme_session_active
            // y eliminamos talkme_license para que si cierra el programa y vuelve a abrir sin pagar,
            // la aplicación se abra limpiamente desde la pantalla de login.
            localStorage.setItem('talkme_session_active', 'false');
            localStorage.removeItem('talkme_license');
        } else {
            document.getElementById('sec-login').style.display = 'block';
            localStorage.setItem('talkme_session_active', 'false');
            const btnKey = document.getElementById('btnOpenPrelaunchSettings');
            if (btnKey) btnKey.style.display = 'none';
        }
    } else {
        const btnKey = document.getElementById('btnOpenPrelaunchSettings');
        if (btnKey) btnKey.style.display = 'none';
    }
};

async function processStripeSuccess(sessionId, userId) {
    if (!userId) {
        userId = localStorage.getItem('talkme_user_id') || 0;
    }
    logStatus(translations[currentLang].log_stripe_success || "✅ Pago de Stripe capturado. Generando licencia...", 'warning');
    document.getElementById('sec-login').style.display = 'none';
    document.getElementById('sec-stripe').style.display = 'block';

    try {
        const res = await fetch('/api/stripe-success', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, user_id: userId })
        });

        const data = await res.json();
        if (data.success) {
            currentLicenseKey = data.license_key;
            localStorage.setItem('talkme_license', currentLicenseKey);

            document.getElementById('sec-stripe').style.display = 'none';
            document.getElementById('sec-validate').style.display = 'block';
            document.getElementById('user-license-key').innerText = currentLicenseKey;
            document.getElementById('val-license').value = currentLicenseKey;

            logStatus((translations[currentLang].log_license_created || "🎉 ¡Licencia creada con éxito! Clave: {key}").replace('{key}', currentLicenseKey));
        } else {
            logStatus((translations[currentLang].log_license_save_error || "Error guardando licencia: {error}").replace('{error}', getLocalizedApiError(data.error, data.error_code)), 'error');
        }
    } catch (err) {
        logStatus(translations[currentLang].log_net_error_license || "Error de red guardando licencia.", 'error');
    }
}

async function performAutomaticValidation(licenseKey, email) {
    try {
        const res = await fetch('/api/validate-system', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseKey, userId: "auto-" + email, lang: currentLang || 'es' })
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('sec-login').style.display = 'none';
            document.getElementById('sec-validate').style.display = 'none';
            document.getElementById('sec-start-server').style.display = 'block';
            const headerActions = document.getElementById('globalLangSwitcher');
            if (headerActions) {
                headerActions.style.display = 'flex';
                headerActions.style.opacity = '1';
                headerActions.style.pointerEvents = 'auto';
            }
            const btnKeySettings = document.getElementById('btnOpenPrelaunchSettings');
            if (btnKeySettings) {
                btnKeySettings.style.display = 'flex';
                btnKeySettings.style.opacity = '1';
                btnKeySettings.style.pointerEvents = 'auto';
            }

            downloadModel(currentLang);

            localStorage.setItem('talkme_email', email);
            localStorage.setItem('talkme_license', licenseKey);
            // Only save expiry if we actually have a real date
            if (data.expiration_date) {
                localStorage.setItem('talkme_license_expiry', data.expiration_date);
            }
            if (data.license_status) {
                localStorage.setItem('talkme_license_status', data.license_status);
            }
            if (data.expires_raw) {
                localStorage.setItem('talkme_license_expiry_raw', data.expires_raw);
            } else if (data.expiration_date) {
                localStorage.setItem('talkme_license_expiry_raw', data.expiration_date);
            }
            if (data.trial_duration_days) {
                localStorage.setItem('talkme_trial_initial_days', data.trial_duration_days.toString());
            }
            localStorage.setItem('talkme_session_active', 'true');
            if (data.plan_type) localStorage.setItem('talkme_plan_type', data.plan_type);
            if (data.device_limit) localStorage.setItem('talkme_device_limit', data.device_limit);
            if (data.active_bindings) localStorage.setItem('talkme_active_bindings', data.active_bindings);
            if (data.payment_mode) localStorage.setItem('talkme_payment_mode', data.payment_mode);
            if (data.total_price !== undefined) localStorage.setItem('talkme_total_price', data.total_price);
            if (data.total_paid !== undefined) localStorage.setItem('talkme_total_paid', data.total_paid);

            // [MURPHY SHIELD]: Si proviene de un primer registro, desplegar la fiesta de bienvenida
            // y posponer la comprobación de descarga pesada hasta que el usuario pulse "Ingresar".
            if (localStorage.getItem('talkme_pending_trial_welcome') === 'true') {
                showTrialWelcomeModal(data);
            } else {
                checkAndPromptTranslateDownload();
            }
            if (data.version_channel) {
                cachedVersionChannelData = data.version_channel;
                _talkmeRealOnline = true; // La validación online exitosa confirma conectividad real
                try {
                    localStorage.setItem('talkme_version_channel', JSON.stringify(data.version_channel));
                } catch (e) { }
                renderVersionUpdatesChannel(currentLang);
            }
            return true;
        } else {
            // [MURPHY SHIELD]: Si requiere regularizar RTO o venció cuota, mostrar directamente la pantalla RTO
            if (data.error_code === 'RTO_PAYMENT_REQUIRED') {
                const t = translations[currentLang] || translations['es'] || {};
                logStatus((t.log_validation_error || "Error Soberanía: {error}").replace('{error}', getLocalizedApiError(data.error, data.error_code)), 'error');
                showRtoRenewalScreen(data.rto_details || {});
                return 'RTO_SCREEN';
            }
            return false;
        }
    } catch (e) {
        return false;
    }
}

async function register() {
    const termsCheck = document.getElementById('reg-terms-check');
    if (termsCheck && !termsCheck.checked) {
        const errorMsg = (translations[currentLang] && translations[currentLang].terms_required) || "Debe aceptar los términos de uso y condiciones de licencia para registrarse.";
        showCustomAlert(translations[currentLang].alert_emergency_title || "Aviso de Licencia", errorMsg, false);
        return;
    }

    const first_name = document.getElementById('reg-name').value;
    const last_name = document.getElementById('reg-lastname').value;
    const company_name = document.getElementById('reg-company').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name, last_name, company_name, email, password, lang: currentLang || 'es' })
        });
        const data = await res.json();
        if (data.success) {
            logStatus("🎉 " + (translations[currentLang].log_register_success || "Registro exitoso: Creada cuenta para {email}").replace('{email}', email));

            const userId = data.user_id || (data.user && data.user.id) || 0;
            currentUser = data.user || { id: userId, email: email };

            localStorage.setItem('talkme_email', email);
            if (userId) {
                localStorage.setItem('talkme_user_id', userId);
            }
            localStorage.setItem('talkme_license', data.license_key);
            localStorage.setItem('talkme_license_expiry', data.expires_at || '');
            if (data.expires_at) {
                localStorage.setItem('talkme_license_expiry_raw', data.expires_at);
            }
            localStorage.setItem('talkme_license_status', 'trial');
            localStorage.setItem('talkme_payment_mode', 'one_time');
            localStorage.setItem('talkme_total_price', '169.23');
            localStorage.setItem('talkme_total_paid', '0.00');
            localStorage.setItem('talkme_plan_type', 'freelance');
            localStorage.setItem('talkme_device_limit', '1');
            localStorage.setItem('talkme_active_bindings', '1');

            // [MURPHY SHIELD]: Activar bandera de bienvenida exclusiva para el primer registro
            const trialDaysReceived = data.trial_duration_days || 30;
            localStorage.setItem('talkme_pending_trial_welcome', 'true');
            localStorage.setItem('talkme_trial_initial_days', trialDaysReceived.toString());

            // Auto-rellenar y validar
            document.getElementById('val-license').value = data.license_key;
            document.getElementById('sec-register').style.display = 'none';
            document.getElementById('sec-validate').style.display = 'block';

            // Forzar validación asíncrona
            await validateLicense();
        } else {
            logStatus((translations[currentLang].log_register_error || "Error en registro: {error}").replace('{error}', getLocalizedApiError(data.error, data.error_code)), 'error');
        }
    } catch (e) {
        logStatus(translations[currentLang].log_net_error_server || "Error de red conectando con el servidor.", 'error');
    }
}

async function login() {
    const email = document.getElementById('log-email').value;
    const password = document.getElementById('log-pass').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            // INTERCEPTOR DE SEGURIDAD OFFLINE (Surgical Fix)
            if (data.mode === 'OFFLINE' && data.warningCode) {
                const lang = currentLang || 'es';
                const title = translations[lang].alert_emergency_title || "Licencia";
                const mainMessage = translations[lang]['msg_' + data.warningCode.toLowerCase()] || "";
                const strikesLabel = translations[lang].lbl_strikes_remaining || "";
                const strikesRemaining = 3 - data.strikesUsed;
                const finalText = `${mainMessage}\n\n${strikesLabel} ${strikesRemaining}/3`;
                showCustomAlert(title, finalText, false);
            }
            currentUser = data.user;
            localStorage.setItem('talkme_email', email);
            localStorage.setItem('talkme_user_id', data.user.id);

            document.getElementById('sec-login').style.display = 'none';
            document.getElementById('logged-email').innerText = email;

            if (data.license_key) {
                currentLicenseKey = data.license_key;
                localStorage.setItem('talkme_license', currentLicenseKey);

                document.getElementById('sec-login').style.display = 'none';
                document.getElementById('sec-validate').style.display = 'block';
                document.getElementById('user-license-key').innerText = currentLicenseKey;
                document.getElementById('val-license').value = currentLicenseKey;

                // [INGENIERÍA DEFENSIVA]: Validación automática inmediata tras login exitoso.
                // Si la licencia tiene RTO pendiente, saltará limpiamente a la pantalla de cuota
                // o al panel principal sin obligar al usuario a hacer clic manual en el botón de verificar.
                await validateLicense();
            } else {
                document.getElementById('sec-stripe').style.display = 'block';
            }
        } else {
            logStatus((translations[currentLang].log_login_error || "Error en login: {error}").replace('{error}', getLocalizedApiError(data.error, data.error_code)), 'error');
        }
    } catch (e) {
        logStatus(translations[currentLang].log_net_error_login || "Error de red en login.", 'error');
    }
}

let paymentPollingInterval = null;

function checkPaymentStatus(safeUserId, safeEmail) {
    fetch('/api/stripe-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: safeUserId, email: safeEmail })
    })
        .then(res => res.json())
        .then(async data => {
            if (data.success && data.license_key) {
                if (paymentPollingInterval) {
                    clearInterval(paymentPollingInterval);
                    paymentPollingInterval = null;
                }
                logStatus((translations[currentLang] && translations[currentLang].log_stripe_confirmed) || "✅ ¡Pago confirmado por Stripe! Procesando activación...");

                currentLicenseKey = data.license_key;
                localStorage.setItem('talkme_license', currentLicenseKey);
                localStorage.setItem('talkme_session_active', 'true');

                document.getElementById('val-license').value = currentLicenseKey;
                document.getElementById('sec-stripe').style.display = 'none';
                document.getElementById('sec-login').style.display = 'none';
                document.getElementById('sec-validate').style.display = 'block';

                await validateLicense(true);
            }
        })
        .catch(e => console.error("Error comprobando pago:", e));
}

function startPaymentPolling(userId = 0, userEmail = '') {
    if (paymentPollingInterval) {
        clearInterval(paymentPollingInterval);
    }
    const safeUserId = userId || (currentUser && currentUser.id) || localStorage.getItem('talkme_user_id') || 0;
    const safeEmail = userEmail || (currentUser && currentUser.email) || localStorage.getItem('talkme_email') || '';

    logStatus((translations[currentLang] && translations[currentLang].log_waiting_stripe) || "💳 Esperando confirmación de pago de Stripe. No cierres esta ventana...");

    // Verificación inmediata inicial
    checkPaymentStatus(safeUserId, safeEmail);

    // Escuchador al enfocar la ventana de Electron
    window.onfocus = () => {
        checkPaymentStatus(safeUserId, safeEmail);
    };

    // Sondeo de alta frecuencia a 2000ms
    paymentPollingInterval = setInterval(() => {
        checkPaymentStatus(safeUserId, safeEmail);
    }, 2000);
}

async function buyLicense(planType = 'freelance', paymentMode = 'one_time') {
    if (currentLang) {
        localStorage.setItem('talkme_lang', currentLang);
    }
    logStatus(translations[currentLang].log_redirecting_stripe || "Redirigiendo a la pasarela segura de Stripe...");
    const email = localStorage.getItem('talkme_email') || (currentUser && currentUser.email) || '';
    const userId = (currentUser && currentUser.id) || localStorage.getItem('talkme_user_id') || 0;
    try {
        const res = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, userEmail: email, planType: planType, paymentMode: paymentMode, lang: currentLang || 'es', origin: 'https://www.talk-me.app' })
        });
        const data = await res.json();
        if (data.url) {
            // [INGENIERÍA DEFENSIVA]: Abrir mediante window.open() para que:
            // 1. En navegador (pre-launch) sea una ventana creada por script y window.close() pueda cerrarla automáticamente.
            // 2. En Electron (setWindowOpenHandler) se abra limpiamente en el navegador externo sin navegar la ventana principal.
            const popup = window.open(data.url, '_blank');
            if (!popup) {
                window.location.href = data.url;
            }
            // Iniciar sondeo de confirmación de pago
            startPaymentPolling(userId, email);
        } else {
            logStatus((translations[currentLang].log_stripe_init_error || "Error iniciando Stripe: {error}").replace('{error}', data.error), 'error');
        }
    } catch (e) {
        logStatus(translations[currentLang].log_stripe_connect_error || "Error conectando con la pasarela de Stripe.", 'error');
    }
}

async function validateLicense(isFromPayment = false, retryCount = 0) {
    if (paymentPollingInterval) {
        clearInterval(paymentPollingInterval);
        paymentPollingInterval = null;
    }
    const btnValidate = document.getElementById('btn-validate-license');
    if (!btnValidate) return;
    btnValidate.disabled = true;
    const originalText = btnValidate.innerText;
    const verifyingText = (translations[currentLang] && translations[currentLang].verifying) || "Validando...";
    btnValidate.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 6px; animation: spin 2s linear infinite;"><path d="M5 2h14M5 22h14M19 2v4a7 7 0 0 1-7 7 7 7 0 0 1-7-7V2M19 22v-4a7 7 0 0 0-7-7 7 7 0 0 0-7 7v4"></path></svg> <span style="vertical-align: middle;">${verifyingText}</span>`;
    try {
        const licenseKey = document.getElementById('val-license').value;
        const email = localStorage.getItem('talkme_email') || "anon";

        const res = await fetch('/api/validate-system', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseKey, userId: "validate-" + email, lang: currentLang || 'es' })
        });
        const data = await res.json();

        if (data.success) {
            // INTERCEPTOR DE SEGURIDAD OFFLINE (Surgical Fix)
            if (data.mode === 'OFFLINE' && data.warningCode) {
                const lang = currentLang || 'es';
                const title = translations[lang].alert_emergency_title || "Licencia";
                const mainMessage = translations[lang]['msg_' + data.warningCode.toLowerCase()] || "";
                const strikesLabel = translations[lang].lbl_strikes_remaining || "";
                const strikesRemaining = 3 - data.strikesUsed;
                const finalText = `${mainMessage}\n\n${strikesLabel} ${strikesRemaining}/3`;
                showCustomAlert(title, finalText, false);
            }
            localStorage.setItem('talkme_license', licenseKey);
            localStorage.setItem('talkme_license_expiry', data.expiration_date || '');
            if (data.license_status) {
                localStorage.setItem('talkme_license_status', data.license_status);
            }
            if (data.expires_raw) {
                localStorage.setItem('talkme_license_expiry_raw', data.expires_raw);
            } else if (data.expiration_date) {
                localStorage.setItem('talkme_license_expiry_raw', data.expiration_date);
            }
            if (data.trial_duration_days) {
                localStorage.setItem('talkme_trial_initial_days', data.trial_duration_days.toString());
            }
            localStorage.setItem('talkme_session_active', 'true');
            if (data.plan_type) localStorage.setItem('talkme_plan_type', data.plan_type);
            if (data.payment_mode) localStorage.setItem('talkme_payment_mode', data.payment_mode);
            if (data.device_limit) localStorage.setItem('talkme_device_limit', data.device_limit);
            if (data.active_bindings) localStorage.setItem('talkme_active_bindings', data.active_bindings);
            if (data.total_price !== undefined) localStorage.setItem('talkme_total_price', data.total_price);
            if (data.total_paid !== undefined) localStorage.setItem('talkme_total_paid', data.total_paid);
            if (data.version_channel) {
                cachedVersionChannelData = data.version_channel;
                _talkmeRealOnline = true; // La validación online exitosa confirma conectividad real
                try {
                    localStorage.setItem('talkme_version_channel', JSON.stringify(data.version_channel));
                } catch (e) { }
                renderVersionUpdatesChannel(currentLang);
            }
            document.getElementById('sec-validate').style.display = 'none';
            document.getElementById('sec-stripe').style.display = 'none';
            const secRtoOk = document.getElementById('sec-rto-renewal');
            if (secRtoOk) secRtoOk.style.display = 'none';
            const dashOk = document.querySelector('.dashboard');
            if (dashOk) dashOk.classList.remove('has-rto-renewal');
            document.getElementById('sec-start-server').style.display = 'block';
            document.getElementById('motor-status').innerText = translations[currentLang].btn_validate_active;
            document.getElementById('motor-status').style.color = '#00ff88';
            const headerActions = document.getElementById('globalLangSwitcher');
            if (headerActions) {
                headerActions.style.display = 'flex';
                headerActions.style.opacity = '1';
                headerActions.style.pointerEvents = 'auto';
            }
            const btnKeySettings = document.getElementById('btnOpenPrelaunchSettings');
            if (btnKeySettings) {
                btnKeySettings.style.display = 'flex';
                btnKeySettings.style.opacity = '1';
                btnKeySettings.style.pointerEvents = 'auto';
            }
            if (typeof updateSettingsButtonPulse === 'function') {
                updateSettingsButtonPulse();
            }
            downloadModel(currentLang);

            // [MURPHY SHIELD]: Si proviene de un primer registro, desplegar la fiesta de bienvenida
            // y posponer la comprobación de descarga pesada hasta que el usuario pulse "Ingresar".
            if (localStorage.getItem('talkme_pending_trial_welcome') === 'true') {
                showTrialWelcomeModal(data);
            } else {
                checkAndPromptTranslateDownload();
            }
        } else {
            // Reintento silencioso si la llamada proviene inmediatamente de una confirmación de pago
            if (isFromPayment && retryCount < 3) {
                logStatus((translations[currentLang] && translations[currentLang].log_syncing_payment) || "⌛ Sincronizando activación de pago con el servidor central...", 'warning');
                setTimeout(() => {
                    validateLicense(true, retryCount + 1);
                }, 1500);
                return;
            }

            logStatus((translations[currentLang].log_validation_error || "Error Soberanía: {error}").replace('{error}', getLocalizedApiError(data.error, data.error_code)), 'error');

            // [MURPHY SHIELD]: Intercepción quirúrgica si se requiere renovación de cuota Rent-to-Own
            if (data.error_code === 'RTO_PAYMENT_REQUIRED') {
                showRtoRenewalScreen(data.rto_details || {});
                return;
            }

            // Si el error es por expiración, bloqueo por versión no cubierta, abuso de prueba o impagos de suscripción
            const blockedCodes = ['LICENSE_EXPIRED', 'UPGRADE_REQUIRED', 'VERSION_OUT_OF_COVERAGE', 'TRIAL_ALREADY_USED', 'RTO_BLOCKED_PAYMENT_REQUIRED', 'RTO_BLOCKED_3_STRIKES'];
            if (blockedCodes.includes(data.error_code) || data.error.includes("expirado") || data.error.includes("bloqueada") || data.error.includes("consumido") || data.error.includes("adquiera una licencia") || data.error.includes("actualización")) {

                // Alertas estilizadas y redirección directa con mapeo de traducción local
                const localizedError = getLocalizedApiError(data.error, data.error_code);
                showCustomAlert(translations[currentLang].alert_emergency_title || "Aviso de Licencia", localizedError, false);

                setTimeout(() => {
                    // Ocultamos la pantalla de verificación
                    document.getElementById('sec-validate').style.display = 'none';
                    // Mostramos directamente el panel de Stripe con las opciones de adquisición
                    document.getElementById('sec-stripe').style.display = 'block';

                    // Rellenamos el email autenticado en el banner de Stripe
                    const email = localStorage.getItem('talkme_email') || '';
                    document.getElementById('logged-email').innerText = email;
                    const btnKey = document.getElementById('btnOpenPrelaunchSettings');
                    if (btnKey) btnKey.style.display = 'none';
                }, 3000);

            } else {
                const localizedError = getLocalizedApiError(data.error, data.error_code);
                showCustomAlert(translations[currentLang].alert_emergency_title || "Aviso de Licencia", localizedError, false);

                setTimeout(() => {
                    document.getElementById('sec-validate').style.display = 'none';
                    document.getElementById('sec-login').style.display = 'block';
                    btnValidate.disabled = false;
                    btnValidate.innerText = originalText;
                    const btnKey = document.getElementById('btnOpenPrelaunchSettings');
                    if (btnKey) btnKey.style.display = 'none';
                }, 3000);
            }
        }
    } catch (e) {
        logStatus(translations[currentLang].log_net_error_validation || "Error de red validando la licencia.", 'error');
        btnValidate.disabled = false;
        btnValidate.innerText = originalText;
    }
}

// ==========================================================================
// CONTROLADOR DE PROGRESIÓN DE HORIZONTE CUÁNTICO (QUANTUM SWEEP ENGINE)
// ==========================================================================
const LaunchProgress = {
    current: 0,
    target: 0,
    container: null,
    started: false,
    init() {
        this.container = document.getElementById('launchProgressBarContainer');
        this.bar = document.getElementById('launchProgressBar');
    },
    start() {
        if (!this.container || !this.bar) this.init();
        this.started = true;
        if (this.container) {
            this.container.classList.add('active');
        }
        // 🚀 Comienza visiblemente desde el extremo izquierdo absoluto (0%)
        // y da el primer pulso suave al 6%
        if (this.bar) {
            this.bar.style.width = '0%';
        }
        setTimeout(() => {
            const initial = Math.max(6, this.current || 6);
            this.setStage(initial);
        }, 50);
    },
    setStage(percent) {
        if (!this.bar) this.init();
        const cleanVal = Math.min(100, Math.max(this.current, percent));
        this.current = cleanVal;
        this.target = cleanVal;
        if (this.bar && this.started) {
            this.bar.style.width = cleanVal + '%';
        }
    },
    stepAsymptotic() {
        // En cada iteración de comprobación HTTPS, avanza suavemente hacia el 90%
        if (this.current < 90) {
            const delta = (90 - this.current) * 0.10;
            this.setStage(this.current + Math.max(delta, 0.6));
        }
    },
    complete(onDone) {
        if (!this.bar) this.init();
        this.setStage(100);
        if (this.bar) {
            this.bar.classList.add('completed');
        }
        // Desvanecimiento suave y sutil de la barra al completar para ceder todo el protagonismo a las estrellas
        setTimeout(() => {
            if (this.container) {
                this.container.classList.add('fading-out');
            }
        }, 120);

        if (typeof onDone === 'function') {
            setTimeout(onDone, 380);
        }
    },
    error() {
        if (!this.bar) this.init();
        if (this.bar) {
            this.bar.classList.add('error');
        }
    }
};

async function startMainServer() {
    // 🛡️ Blindaje Murphy: Interceptación si el motor de traducción no está instalado o se está descargando
    if (isTranslationEnabled() && !_translatePostponedThisSession) {
        try {
            // A. Comprobar si ya se está descargando activamente en background
            const dlRes = await fetch('/api/download-progress');
            const dlData = await dlRes.json();
            if (dlData && dlData.downloads && dlData.downloads['translate'] && dlData.downloads['translate'].status === 'downloading') {
                showDownloadTranslateModal('progress');
                return; // Bloquea arranque hasta que el usuario decida esperar o posponer
            }

            // B. Comprobar si el modelo está validado físicamente en disco (>2.6 GB)
            const currentPath = getEffectiveModelsPath();
            const chkRes = await fetch(`/api/check-models?customPath=${encodeURIComponent(currentPath)}`);
            const chkData = await chkRes.json();
            if (chkData && chkData.success && chkData.models && !chkData.models['translate']) {
                showDownloadTranslateModal('decision');
                return; // Bloquea arranque y presenta la modal decisoria
            }
        } catch (chkErr) {
            console.warn("⚠️ [PRE-LAUNCH] Error verificando estado del motor de traducción:", chkErr.message);
        }
    }

    // 🛡️ Ocultar inmediatamente la cabecera flotante de idioma y llave de ajustes
    const headerActions = document.getElementById('globalLangSwitcher');
    if (headerActions) {
        headerActions.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        headerActions.style.opacity = '0';
        headerActions.style.pointerEvents = 'none';
        setTimeout(() => { headerActions.style.display = 'none'; }, 250);
    }
    const btnKeySettings = document.getElementById('btnOpenPrelaunchSettings');
    if (btnKeySettings) {
        btnKeySettings.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        btnKeySettings.style.opacity = '0';
        btnKeySettings.style.pointerEvents = 'none';
        setTimeout(() => { btnKeySettings.style.display = 'none'; }, 250);
    }
    const modalSettings = document.getElementById('prelaunchSettingsModal');
    if (modalSettings) {
        modalSettings.style.display = 'none';
    }

    const btn = document.querySelector('.btn-ignition');
    const originalText = btn ? btn.innerHTML : '';

    // Get actually installed languages from lastModelsData
    const installedLanguages = allSpeechLanguages.filter(lang => !!lastModelsData[lang.code]);

    const baseEs = [
        "[SYS] Cargando kernel principal...",
        "[DRM] Comprobando ID de hardware...",
        "[MEM] Reservando bloques de memoria RAM...",
        "[AUDIO] Mapeando canales de salida...",
        "[SYS] Levantando hilos de procesamiento...",
        "[DRM] Sello criptográfico validado...",
        "[VOSK] Iniciando buffers offline...",
        "[SYS] Limpiando caché de grabaciones...",
        "[AUDIO] Detectando dispositivos WDM...",
        "[NET] Abriendo puertos del Firewall...",
        "[VOSK] Inicializando diccionario fonético...",
        "[SYS] Activando módulo de contingencia...",
        "[MEM] Optimizando paginación de memoria...",
        "[AUDIO] Configurando latencia ultra-baja...",
        "[DRM] Comprobando strike DRM local...",
        "[NET] Validando protocolo HTTPS...",
        "[AUDIO] Iniciando emulación ASIO...",
        "[SYS] Sincronizando variables globales...",
        "[AI-ENGINE] Hilo neural en hibernación...",
        "[VOSK] Cargando biblioteca de lenguaje...",
        "[NET] Resolviendo puerto local 3000...",
        "[SYS] Iniciando secuencia de ignición...",
        "[MEM] Limpieza de espacio terminada...",
        "[AUDIO] Probe de hardware completado...",
        "[SYS] Preparando handoff del proceso...",
        "[DRM] Licencia en línea confirmada..."
    ];

    const baseEn = [
        "[SYS] Loading main kernel...",
        "[DRM] Verifying hardware fingerprint...",
        "[MEM] Allocating system RAM blocks...",
        "[AUDIO] Mapping audio output channels...",
        "[SYS] Spawning worker threads...",
        "[DRM] Cryptographic seal validated...",
        "[VOSK] Initializing offline buffers...",
        "[SYS] Cleaning up recording cache...",
        "[AUDIO] Detecting WDM devices...",
        "[NET] Opening Firewall ports...",
        "[VOSK] Initializing phonetic dictionary...",
        "[SYS] Activating contingency module...",
        "[MEM] Optimizing page table cache...",
        "[AUDIO] Configuring ultra-low latency...",
        "[DRM] Verifying local DRM strike status...",
        "[NET] Validating HTTPS protocol...",
        "[AUDIO] Starting ASIO emulator...",
        "[SYS] Syncing global variables...",
        "[AI-ENGINE] Neural thread in hibernation...",
        "[VOSK] Loading language dictionary...",
        "[NET] Binding local port 3000...",
        "[SYS] Initiating ignition sequence...",
        "[MEM] RAM cleanup complete...",
        "[AUDIO] Hardware probe successful...",
        "[SYS] Preparing process handoff...",
        "[DRM] Online license confirmed..."
    ];

    const baseEu = [
        "[SYS] Nukleo nagusia kargatzen...",
        "[DRM] Hardware IDa egiaztatzen...",
        "[MEM] RAM memoria blokeak erreserbatzen...",
        "[AUDIO] Irteera kanalak mapeatzen...",
        "[SYS] Prozesamendu-hariak abiarazten...",
        "[DRM] Zigilu kriptografikoa balioztatuta...",
        "[VOSK] Konexiorik gabeko bufferrak hasieratzen...",
        "[SYS] Grabazioen katxea garbitzen...",
        "[AUDIO] WDM gailuak detektatzen...",
        "[NET] Suhesi portuak irekitzen...",
        "[VOSK] Hiztegi fonetikoa hasieratzen...",
        "[SYS] Kontingentzia modulua aktibatzen...",
        "[MEM] Memoria orrialdekatzea optimizatzen...",
        "[AUDIO] Latentzia ultra-baxua konfiguratzen...",
        "[DRM] Tokiko DRM strikea egiaztatzen...",
        "[NET] HTTPS protokoloa balioztatzen...",
        "[AUDIO] ASIO emulazioa hasieratzen...",
        "[SYS] Aldagai globalak sinkronizatzen...",
        "[AI-ENGINE] Hari neurala hibernazioan...",
        "[VOSK] Hizkuntza liburutegia kargatzen...",
        "[NET] Tokiko 3000 portua ebazten...",
        "[SYS] Pizte sekuentzia abiarazten...",
        "[MEM] Espazioa garbitzen amaituta...",
        "[AUDIO] Hardware proba osatuta...",
        "[SYS] Prozesuaren esku-ematea prestatzen...",
        "[DRM] Lineako lizentzia berretsita..."
    ];

    const baseCa = [
        "[SYS] Carregant el nucli principal...",
        "[DRM] Comprovant l'ID de maquinari...",
        "[MEM] Reservant blocs de memòria RAM...",
        "[AUDIO] Mapejant canals de sortida...",
        "[SYS] Aixecant fils de processament...",
        "[DRM] Segell criptogràfic validat...",
        "[VOSK] Iniciant buffers offline...",
        "[SYS] Netejant la memòria cau de gravacions...",
        "[AUDIO] Detectant dispositius WDM...",
        "[NET] Obrint ports del Firewall...",
        "[VOSK] Inicialitzant diccionari fonètic...",
        "[SYS] Activant mòdul de contingència...",
        "[MEM] Optimitzant la paginació de memòria...",
        "[AUDIO] Configurant latència ultra-baix...",
        "[DRM] Comprovant strike DRM local...",
        "[NET] Validant protocol HTTPS...",
        "[AUDIO] Iniciant emulació ASIO...",
        "[SYS] Sincronitzant variables globals...",
        "[AI-ENGINE] Fil neural en hibernació...",
        "[VOSK] Carregant biblioteca de llenguatge...",
        "[NET] Resolent port local 3000...",
        "[SYS] Iniciant seqüència d'ignició...",
        "[MEM] Neteja d'espai acabada...",
        "[AUDIO] Sonda de maquinari completada...",
        "[SYS] Preparant el relleu del procés...",
        "[DRM] Llicència en línia confirmada..."
    ];

    const baseGl = [
        "[SYS] Cargando kernel principal...",
        "[DRM] Comprobando ID de hardware...",
        "[MEM] Reservando bloques de memoria RAM...",
        "[AUDIO] Mapeando canles de saída...",
        "[SYS] Levantando fíos de procesamento...",
        "[DRM] Selo criptográfico validado...",
        "[VOSK] Iniciando buffers offline...",
        "[SYS] Limpando caché de gravacións...",
        "[AUDIO] Detectando dispositivos WDM...",
        "[NET] Abrindo portos do Firewall...",
        "[VOSK] Inicializando dicionario fonético...",
        "[SYS] Activando módulo de continxencia...",
        "[MEM] Optimizando paginación de memoria...",
        "[AUDIO] Configurando latencia ultra-baixa...",
        "[DRM] Comprobando strike DRM local...",
        "[NET] Validando protocolo HTTPS...",
        "[AUDIO] Iniciando emulación ASIO...",
        "[SYS] Sincronizando variables globais...",
        "[AI-ENGINE] Fío neural en hibernación...",
        "[VOSK] Cargando biblioteca de linguaxe...",
        "[NET] Resolvendo porto local 3000...",
        "[SYS] Iniciando secuencia de ignición...",
        "[MEM] Limpeza de espazo rematada...",
        "[AUDIO] Probe de hardware completado...",
        "[SYS] Preparando handoff do proceso...",
        "[DRM] Licenza en liña confirmada..."
    ];

    // Add VOSK model loading logs dynamically
    installedLanguages.forEach(langObj => {
        const codeUpper = langObj.code.toUpperCase();
        baseEs.push(`[VOSK] Cargando modelo acústico ${codeUpper}...`);
        baseEn.push(`[VOSK] Loading acoustic model ${codeUpper}...`);
        baseEu.push(`[VOSK] ${codeUpper} eredu akustikoa kargatzen...`);
        baseCa.push(`[VOSK] Carregant model acústic ${codeUpper}...`);
        baseGl.push(`[VOSK] Cargando modelo acústico ${codeUpper}...`);
    });

    // Add ending general logs
    baseEs.push(
        "[SYS] Ejecutando chequeo Pre-Flight...",
        "[AUDIO] Sincronizando SoundGrid RJ45...",
        "[NET] Estableciendo canal de datos..."
    );
    baseEn.push(
        "[SYS] Running Pre-Flight check...",
        "[AUDIO] Syncing soundgrid via RJ45...",
        "[NET] Establishing data stream..."
    );
    baseEu.push(
        "[SYS] Pre-Flight egiaztapena burutzen...",
        "[AUDIO] SoundGrid RJ45 bidez sinkronizatzen...",
        "[NET] Datu kanala ezartzen..."
    );
    baseCa.push(
        "[SYS] Executant comprovació Pre-Flight...",
        "[AUDIO] Sincronitzant SoundGrid RJ45...",
        "[NET] Establint canal de dades..."
    );
    baseGl.push(
        "[SYS] Executando chequeo Pre-Flight...",
        "[AUDIO] Sincronizando SoundGrid RJ45...",
        "[NET] Establecendo canle de datos..."
    );

    const bootLogs = {
        "es": baseEs,
        "en": baseEn,
        "eu": baseEu,
        "ca": baseCa,
        "gl": baseGl
    };

    const lang = ['es', 'ca', 'eu', 'gl'].includes(currentLang) ? currentLang : 'en';
    const logs = bootLogs[lang] || bootLogs['en'];

    let buttonText = 'WARP SPEED';
    let successMsg = '⚡ SOVEREIGN ENGINE SUCCESSFULLY ONLINE';
    let enteringMsg = 'ENTERING COCKPIT';

    if (lang === 'es') {
        buttonText = 'HIPERVELOCIDAD';
        successMsg = '⚡ MOTOR SOBERANO CONECTADO CON ÉXITO';
        enteringMsg = 'ENTRANDO EN CABINA';
    } else if (lang === 'eu') {
        buttonText = 'HIPERABIADURA';
        successMsg = '⚡ MOTOR BURUJABEA ONGI KONEKTATUTA';
        enteringMsg = 'KABINARA SARTZEN';
    } else if (lang === 'ca') {
        buttonText = 'HIPERVELOCITAT';
        successMsg = '⚡ MOTOR SOBIRÀ CONNECTAT AMB ÈXIT';
        enteringMsg = 'ENTRANT A CABINA';
    } else if (lang === 'gl') {
        buttonText = 'HIPERVELOCIDADE';
        successMsg = '⚡ MOTOR SOBERANO CONECTADO CON ÉXITO';
        enteringMsg = 'ENTRANDO EN CABINA';
    }

    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.cursor = 'not-allowed';
        btn.innerHTML = `<span>${buttonText}</span>`;
    }

    logStatus(translations[currentLang].log_boot_sequence || "SECUENCIA DE ARRANCADO INICIADA...", 'warning');

    // Snappier, more progressive exponential acceleration from 1.0 to 48.0
    starVelocityFactor = 1.0;
    let accelInterval = null;
    setTimeout(() => {
        accelInterval = setInterval(() => {
            if (starVelocityFactor >= 48.0) {
                starVelocityFactor = 48.0;
                clearInterval(accelInterval);
                accelInterval = null;
            } else {
                starVelocityFactor = starVelocityFactor + (starVelocityFactor * 0.038) + 0.08;
            }
        }, 30);
    }, 800);

    // Fade out the dashboard container slowly after 1600ms (800ms after acceleration onset)
    setTimeout(() => {
        const headerActions = document.getElementById('globalLangSwitcher');
        if (headerActions) {
            headerActions.style.transition = 'all 1.0s ease';
            headerActions.style.opacity = '0';
            headerActions.style.pointerEvents = 'none';
            setTimeout(() => { headerActions.style.display = 'none'; }, 1000);
        }
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            dashboard.style.transition = 'all 1.8s cubic-bezier(0.25, 1, 0.5, 1)'; // more paused transition
            dashboard.style.opacity = '0';
            dashboard.style.filter = 'blur(15px)';
            dashboard.style.transform = 'scale(1.15)'; // zoom in (opposite of landing zoom out)
            dashboard.style.pointerEvents = 'none';
        }

        // 🌌 Cuando el panel de Pre-Launch ya ha desaparecido y solo reinan las estrellas:
        // Aparece la Barra de Progresión de Horizonte Cuántico en la parte inferior completa
        setTimeout(() => {
            LaunchProgress.start();
        }, 1800);
    }, 1600);

    let logIndex = 0;
    let logDelay = 300; // Start relatively slow
    let logTimeoutId = null;
    let isServerReady = false;

    // Fast accelerating terminal log simulation loop
    const runBootLogs = () => {
        if (isServerReady) return;
        if (logIndex >= logs.length) {
            // Stop after printing all logs exactly once
            return;
        }

        const currentMsg = logs[logIndex];
        logStatus(currentMsg, 'warning');

        // Activamos el punto álgido de Warp (148.0) cuando se inicie la carga de modelos de voz ([VOSK])
        if (currentMsg && (currentMsg.includes('[VOSK]') || currentMsg.includes('modelo acústico') || currentMsg.includes('model') || currentMsg.includes('eredu'))) {
            if (accelInterval) {
                clearInterval(accelInterval);
                accelInterval = null;
            }
            starVelocityFactor = 148.0;
            // 🧠 Carga de Motores Acústicos / Neurales (Fase III: 45%)
            LaunchProgress.setStage(45);
        }

        logIndex++;
        // Maintain a safe delay (min 150ms) to prevent DOM overhead from freezing the warp animation
        logDelay = Math.max(150, logDelay * 0.90);

        logTimeoutId = setTimeout(runBootLogs, logDelay);
    };

    // Start printing logs
    runBootLogs();

    try {
        const modelsPath = getEffectiveModelsPath();
        const translateEnabled = isTranslationEnabled();
        const res = await fetch('/api/start-main-server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                modelsPath,
                lang: currentLang || 'es',
                translateEnabled: translateEnabled
            })
        });
        const data = await res.json();

        if (data.success) {
            // ⚡ Handoff de proceso y arranque de Node (Fase II: 18%)
            LaunchProgress.setStage(18);

            const targetUrl = window.location.origin.replace("http://", "https://") + "/?lang=" + (currentLang || 'es') + "&transitioning=true";
            const maxAttempts = 40;
            let attempt = 0;

            const checkServer = async () => {
                attempt++;
                // 📡 Handshake activo: avanzar gradualmente hacia el 90% (Fase IV)
                LaunchProgress.stepAsymptotic();

                try {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 800);
                    await fetch(targetUrl, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
                    clearTimeout(id);

                    // Server has started! Stop logs and flag readiness
                    isServerReady = true;
                    if (logTimeoutId) clearTimeout(logTimeoutId);
                    if (accelInterval) {
                        clearInterval(accelInterval);
                        accelInterval = null;
                    }

                    // 🏁 Servidor Activo (HTTP 200 OK): Clímax 100% (Fase V)
                    LaunchProgress.complete();

                    // Quick final ramp to warp peak (148.0) if not already reached
                    const startSpeed = starVelocityFactor;
                    const steps = 10;
                    let step = 0;
                    const rampInterval = setInterval(() => {
                        step++;
                        starVelocityFactor = startSpeed + (148.0 - startSpeed) * (step / steps);
                        if (step >= steps) {
                            starVelocityFactor = 148.0;
                            clearInterval(rampInterval);
                        }
                    }, 20);

                    logStatus(successMsg, 'success');
                    if (btn) {
                        btn.innerHTML = `<span>${enteringMsg}</span>`;
                    }

                    // Set transition flag for the main app
                    localStorage.setItem('talkme_transitioning', 'true');

                    // Fast fade out of dashboard if it's not already faded (zoom in / forward transition)
                    const dashboard = document.querySelector('.dashboard');
                    if (dashboard) {
                        dashboard.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
                        dashboard.style.opacity = '0';
                        dashboard.style.filter = 'blur(15px)';
                        dashboard.style.transform = 'scale(1.15)';
                        dashboard.style.pointerEvents = 'none';
                    }

                    // Redirect immediately to main app so we land while still in warp speed
                    setTimeout(() => {
                        window.location.href = targetUrl;
                    }, 800);

                } catch (err) {
                    if (attempt < maxAttempts) {
                        setTimeout(checkServer, 500);
                    } else {
                        isServerReady = true;
                        if (logTimeoutId) clearTimeout(logTimeoutId);
                        LaunchProgress.complete();
                        logStatus(translations[currentLang].log_boot_timeout || "⚠️ Host timeout, redirecting...", 'warning');
                        window.location.href = targetUrl;
                    }
                }
            };

            // Start polling the HTTPS port
            setTimeout(checkServer, 800);

        } else {
            throw new Error(data.error || 'Server startup failed');
        }
    } catch (err) {
        isServerReady = true;
        if (logTimeoutId) clearTimeout(logTimeoutId);
        if (accelInterval) {
            clearInterval(accelInterval);
            accelInterval = null;
        }
        LaunchProgress.error();
        console.error('Failed to start main server:', err);
        logStatus(translations[currentLang].log_boot_failed || "❌ ERROR AL INICIAR EL SERVIDOR", 'error');
        starVelocityFactor = 2.0;

        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.innerHTML = originalText;
        }

        const headerActions = document.getElementById('globalLangSwitcher');
        if (headerActions) {
            headerActions.style.display = 'flex';
            headerActions.style.opacity = '1';
            headerActions.style.pointerEvents = 'auto';
        }
        const btnKeySettings = document.getElementById('btnOpenPrelaunchSettings');
        if (btnKeySettings) {
            btnKeySettings.style.display = 'flex';
            btnKeySettings.style.opacity = '1';
            btnKeySettings.style.pointerEvents = 'auto';
        }
    }
}

async function checkSpeechModels() {
    try {
        const cachedPath = getEffectiveModelsPath();
        const res = await fetch(`/api/check-models?customPath=${encodeURIComponent(cachedPath)}`);
        const data = await res.json();
        if (data.success && data.models) {
            const m = data.models;
            const installedModels = allSpeechLanguages.filter(lang => !!m[lang.code]);
            const tbody = document.getElementById('preflight-engines-body');
            if (tbody) {
                if (installedModels.length === 0) {
                    const missingText = (translations[currentLang] && translations[currentLang].missing) || 'Faltante';
                    const noModelsText = translations[currentLang].lbl_no_engines_installed || 'No engines installed';
                    tbody.innerHTML = `
                        <tr>
                            <td class="preflight-name-td" style="color: rgba(255,255,255,0.4);">${noModelsText}</td>
                            <td class="preflight-status-td">
                                <span class="preflight-status-badge preflight-status-badge--missing">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#f366" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 5px;">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                    ${missingText}
                                </span>
                            </td>
                        </tr>
                    `;
                    // Auto-Polling: Re-escaneo reactivo cada 2.5s si aún no se detecta ningún motor (esperando descompresión en segundo plano)
                    if (window.preflightPollTimer) clearTimeout(window.preflightPollTimer);
                    window.preflightPollTimer = setTimeout(checkSpeechModels, 2500);
                } else {
                    if (window.preflightPollTimer) clearTimeout(window.preflightPollTimer);
                    tbody.innerHTML = installedModels.map(model => {
                        const name = getLanguageName(model.code, currentLang);
                        const installedText = (translations[currentLang] && translations[currentLang].installed) || 'Instalado';
                        return `
                            <tr>
                                <td class="preflight-name-td">
                                    ${name}
                                </td>
                                <td class="preflight-status-td">
                                    <span class="preflight-status-badge">
                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#00ff88" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 5px;">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        ${installedText}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        }
    } catch (e) { }
}

function togglePrelaunchSettings() {
    const modal = document.getElementById('prelaunchSettingsModal');
    const dashboard = document.querySelector('.dashboard');
    if (modal.classList.contains('hidden')) {
        if (dashboard) {
            dashboard.style.transition = 'opacity 0.3s ease';
            dashboard.style.opacity = '0';
            dashboard.style.pointerEvents = 'none';
        }
        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        const filterInput = document.getElementById('engineFilterInput');
        if (filterInput) {
            filterInput.value = '';
        }
        const clearBtn = document.getElementById('btnClearFilter');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        document.getElementById('session-user-email').innerText = localStorage.getItem('talkme_email') || 'N/A';
        document.getElementById('license-tab-key').innerText = localStorage.getItem('talkme_license') || 'N/A';

        const hasLicense = localStorage.getItem('talkme_license');
        if (hasLicense) {
            // New premium card elements
            const badge = document.getElementById('license-active-badge');
            if (badge) badge.style.display = 'flex';
            const activeFooter = document.getElementById('license-active-footer');
            if (activeFooter) activeFooter.style.display = 'block';

            // Legacy refs (kept for safety)
            document.getElementById('license-status-active-box').style.display = 'none';
            document.getElementById('license-status-inactive-box').style.display = 'none';

            // Check if trial to show side-by-side buy box
            const isTrial = localStorage.getItem('talkme_license_status') === 'trial';
            const trialBuyBox = document.getElementById('license-trial-buy-box');
            if (trialBuyBox) {
                trialBuyBox.style.display = isTrial ? 'flex' : 'none';
            }

            // --- Plan Type Badge ---
            updateActiveBadgeText(currentLang);
            const planBadge = document.getElementById('license-plan-badge');
            if (planBadge) {
                planBadge.style.display = 'none'; // Integrated into active badge
            }

            // --- Device Counter ---
            const deviceLimit = parseInt(localStorage.getItem('talkme_device_limit') || '1');
            const activeBindings = parseInt(localStorage.getItem('talkme_active_bindings') || '1');
            const counterEl = document.getElementById('license-device-counter');
            if (counterEl) {
                counterEl.innerText = `${activeBindings}/${deviceLimit}`;
                // Color the counter always in purple-blue like the device ID
                counterEl.style.color = '#a594ff';
            }

            updateExpiryDisplay(currentLang);
        } else {
            const badge = document.getElementById('license-active-badge');
            if (badge) badge.style.display = 'none';
            const activeFooter = document.getElementById('license-active-footer');
            if (activeFooter) activeFooter.style.display = 'none';
            document.getElementById('license-status-active-box').style.display = 'none';
            document.getElementById('license-status-inactive-box').style.display = 'block';

            const trialBuyBox = document.getElementById('license-trial-buy-box');
            if (trialBuyBox) {
                trialBuyBox.style.display = 'none';
            }
        }

        loadTelemetryHistory();
        checkPrelaunchTabModels();

        // Si hay una actualización pendiente (el botón tiene la clase has-update),
        // abrir directamente la pestaña de Licencia en lugar de Sesión/Cuenta.
        const btnKeySettings = document.getElementById('btnOpenPrelaunchSettings');
        if (btnKeySettings && btnKeySettings.classList.contains('has-update')) {
            const licenseNavBtn = document.querySelector("#prelaunchSettingsModal .settings-nav .nav-item:nth-child(2)");
            if (typeof switchPrelaunchTab === 'function') {
                switchPrelaunchTab('prelaunch-tab-license', licenseNavBtn || { classList: { add: () => { }, remove: () => { } } });
            }
            // Si estamos sin conexión (o con actualización pendiente), destacar con animación la tarjeta de versiones
            setTimeout(() => {
                const updateBox = document.getElementById('license-version-updates-box');
                if (updateBox) {
                    updateBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    updateBox.style.transition = 'border-color 0.4s ease, box-shadow 0.4s ease';
                    updateBox.style.borderColor = '#10B981';
                    updateBox.style.boxShadow = '0 0 24px rgba(16, 185, 129, 0.45)';
                    setTimeout(() => {
                        updateBox.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        updateBox.style.boxShadow = 'none';
                    }, 3000);
                }
            }, 200);
        } else {
            // Por defecto, abrir en la pestaña de Sesión
            const sessionNavBtn = document.querySelector("#prelaunchSettingsModal .settings-nav .nav-item:nth-child(1)");
            if (typeof switchPrelaunchTab === 'function' && sessionNavBtn) {
                switchPrelaunchTab('prelaunch-tab-session', sessionNavBtn);
            }
        }
    } else {
        if (dashboard) {
            dashboard.style.opacity = '1';
            dashboard.style.pointerEvents = 'auto';
        }
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function switchPrelaunchTab(tabId, btn) {
    const filterInput = document.getElementById('engineFilterInput');
    if (filterInput) {
        filterInput.value = '';
    }
    const clearBtn = document.getElementById('btnClearFilter');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }

    document.querySelectorAll('#prelaunchSettingsModal .settings-section-content').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    const target = document.getElementById(tabId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'flex';
    }
    document.querySelectorAll('#prelaunchSettingsModal .settings-nav .nav-item').forEach(el => {
        el.classList.remove('active');
    });
    btn.classList.add('active');

    // Fetch real license expiry when License tab opens
    if (tabId === 'prelaunch-tab-license') {
        const licenseKey = localStorage.getItem('talkme_license');
        const expiryEl = document.getElementById('license-expiry-date');
        if (licenseKey && expiryEl) {
            // 1. Show cached value IMMEDIATELY (no waiting)
            updateExpiryDisplay(currentLang);

            // 2. Refresh from backend silently in background
            fetch(`/api/license-info?key=${encodeURIComponent(licenseKey)}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.expires_formatted) {
                        localStorage.setItem('talkme_license_expiry', data.expires_formatted);
                        if (data.expires_raw) {
                            localStorage.setItem('talkme_license_expiry_raw', data.expires_raw);
                        }

                        // --- Actualizar Plan Badge y Device Counter desde API ---
                        if (data.plan_type) {
                            localStorage.setItem('talkme_plan_type', data.plan_type);
                        }
                        if (data.license_status) {
                            localStorage.setItem('talkme_license_status', data.license_status);
                        }
                        if (data.payment_mode) localStorage.setItem('talkme_payment_mode', data.payment_mode);
                        updateActiveBadgeText(currentLang);
                        updateExpiryDisplay(currentLang);

                        // Rellenar la MAC / HW ID del ordenador
                        const hwEl = document.getElementById('linked-hw-id');
                        if (hwEl && data.hw_id) {
                            hwEl.innerText = data.hw_id;
                        }

                        const planBadge = document.getElementById('license-plan-badge');
                        if (planBadge) {
                            planBadge.style.display = 'none'; // Integrated into active badge
                        }
                        if (data.total_price !== undefined) localStorage.setItem('talkme_total_price', data.total_price);
                        if (data.total_paid !== undefined) localStorage.setItem('talkme_total_paid', data.total_paid);
                        if (data.device_limit) {
                            localStorage.setItem('talkme_device_limit', data.device_limit);
                            localStorage.setItem('talkme_active_bindings', data.active_bindings || 1);
                            const counterEl = document.getElementById('license-device-counter');
                            if (counterEl) {
                                counterEl.innerText = `${data.active_bindings || 1}/${data.device_limit}`;
                                counterEl.style.color = '#a594ff';
                            }
                        }
                    } else if (!localStorage.getItem('talkme_license_expiry')) {
                        expiryEl.innerText = '⚠️ Fecha no obtenida del servidor';
                        expiryEl.style.color = '#ffb700';
                    }
                })
                .catch(() => {
                    if (!localStorage.getItem('talkme_license_expiry')) {
                        expiryEl.innerText = '⚠️ Sin conexión (fecha no disponible)';
                        expiryEl.style.color = '#ffb700';
                    }
                });
        }
    }

    if (tabId === 'prelaunch-tab-guide') {
        if (typeof loadPrelaunchGuide === 'function') {
            loadPrelaunchGuide(currentLang);
        }
    }

    if (tabId === 'prelaunch-tab-translation') {
        if (typeof updatePrelaunchTranslateTab === 'function') {
            updatePrelaunchTranslateTab();
        }
    }

    if (tabId === 'prelaunch-tab-legal') {
        if (typeof loadPrelaunchLegal === 'function') {
            loadPrelaunchLegal(currentLang);
        }
    }
}

function deregisterDevice() {
    const licenseKey = localStorage.getItem('talkme_license');
    if (!licenseKey) return;

    let userName = 'Usuario';
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.first_name) {
        userName = currentUser.first_name;
    } else {
        const email = localStorage.getItem('talkme_email');
        if (email) {
            userName = email.split('@')[0];
            userName = userName.charAt(0).toUpperCase() + userName.slice(1);
        }
    }
    const titleTemplate = (translations[currentLang] && translations[currentLang].warning_title_user) || (translations['es'] && translations['es'].warning_title_user) || `¡Atención {user}!`;
    document.getElementById('deregisterConfirmTitle').innerText = titleTemplate.replace('{user}', userName);

    document.getElementById('deregisterConfirmModal').classList.remove('hidden');
    document.getElementById('deregisterConfirmModal').style.display = 'flex';
}

function closeDeregisterConfirm() {
    document.getElementById('deregisterConfirmModal').classList.add('hidden');
    document.getElementById('deregisterConfirmModal').style.display = 'none';
}

function clearLocalSessionState() {
    const keysToRemove = [
        'talkme_email',
        'talkme_user_id',
        'talkme_license',
        'talkme_license_expiry',
        'talkme_license_expiry_raw',
        'talkme_license_status',
        'talkme_plan_type',
        'talkme_payment_mode',
        'talkme_device_limit',
        'talkme_active_bindings',
        'talkme_total_price',
        'talkme_total_paid',
        'talkme_pending_trial_welcome',
        'talkme_version_channel'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem('talkme_session_active', 'false');
    _currentRtoDetails = null;
    currentUser = null;
    currentLicenseKey = null;
    const secRto = document.getElementById('sec-rto-renewal');
    if (secRto) secRto.style.display = 'none';
    const dash = document.querySelector('.dashboard');
    if (dash) dash.classList.remove('has-rto-renewal');
}

async function executeDeregisterDevice() {
    closeDeregisterConfirm();
    const licenseKey = localStorage.getItem('talkme_license');
    if (!licenseKey) return;
    const lang = currentLang || 'es';
    try {
        const res = await fetch('/api/deregister-license', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseKey })
        });
        const data = await res.json();
        if (data.success) {
            clearLocalSessionState();

            togglePrelaunchSettings();
            const successMsg = (translations[lang] && translations[lang].msg_device_deregistered_success) || data.message;
            showCustomAlert(translations[lang].alert_emergency_title || "Licencia", successMsg, true);

            setTimeout(() => {
                location.reload();
            }, 2500);
        } else {
            const title = translations[lang]?.title_error || "Error";
            const fallbackMsg = lang === 'es' ? "No se pudo desvincular el equipo." : (lang === 'en' ? "Could not deregister the device." : "Ezin izan da taldea desestekatu.");
            showCustomAlert(title, data.error || fallbackMsg, false);
        }
    } catch (e) {
        const title = translations[lang]?.title_error || "Error";
        const connectionErrorMsg = lang === 'es' ? "Error de conexión desvinculando el equipo." : (lang === 'en' ? "Connection error while deregistering the device." : "Konexio errorea gailua desvinculatzean.");
        showCustomAlert(title, connectionErrorMsg, false);
    }
}

function confirmLogout() {
    let userName = 'Usuario';
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.first_name) {
        userName = currentUser.first_name;
    } else {
        const email = localStorage.getItem('talkme_email');
        if (email) {
            userName = email.split('@')[0];
            userName = userName.charAt(0).toUpperCase() + userName.slice(1);
        }
    }

    const titleTemplate = (translations[currentLang] && translations[currentLang].warning_title_user) || (translations['es'] && translations['es'].warning_title_user) || `¡Atención {user}!`;
    document.getElementById('logoutWarningTitle').innerText = titleTemplate.replace('{user}', userName);

    document.getElementById('logoutWarningModal').classList.remove('hidden');
    document.getElementById('logoutWarningModal').style.display = 'flex';
}

function closeLogoutWarning() {
    document.getElementById('logoutWarningModal').classList.add('hidden');
    document.getElementById('logoutWarningModal').style.display = 'none';
}

function executeLogout() {
    clearLocalSessionState();
    closeLogoutWarning();
    document.getElementById('prelaunchSettingsModal').classList.add('hidden');
    document.getElementById('prelaunchSettingsModal').style.display = 'none';

    const dashboard = document.querySelector('.dashboard');
    if (dashboard) {
        dashboard.style.filter = 'none';
        dashboard.style.opacity = '1';
        dashboard.style.pointerEvents = 'auto';
    }

    document.getElementById('btnOpenPrelaunchSettings').style.display = 'none';
    document.getElementById('sec-login').style.display = 'block';
    document.getElementById('sec-register').style.display = 'none';
    document.getElementById('sec-stripe').style.display = 'none';
    document.getElementById('sec-validate').style.display = 'none';
    document.getElementById('sec-start-server').style.display = 'none';
    document.getElementById('log-email').value = '';
    document.getElementById('log-pass').value = '';
    document.getElementById('val-license').value = '';
}

function showCustomAlert(title, text, isSuccess = false) {
    document.getElementById('customAlertTitle').innerText = title;
    document.getElementById('customAlertText').innerText = text;
    const icon = document.getElementById('alertIcon');
    const modalContent = document.getElementById('customAlertModal').querySelector('.modal-content');
    const btn = document.getElementById('customAlertBtn');
    btn.innerText = (translations[currentLang]?.btn_ok || translations['en']?.btn_ok || "OK");

    if (isSuccess) {
        icon.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
        icon.style.stroke = '#10B981';
        modalContent.style.borderColor = '#10B981';
        modalContent.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.15)';
        btn.className = 'btn-custom-alert-success';
    } else {
        icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
        icon.style.stroke = '#f366';
        modalContent.style.borderColor = '#f366';
        modalContent.style.boxShadow = '0 8px 32px rgba(255, 51, 102, 0.15)';
        btn.className = 'btn-custom-alert-error';
    }

    document.getElementById('customAlertModal').classList.remove('hidden');
    document.getElementById('customAlertModal').style.display = 'flex';
}

function closeCustomAlert() {
    document.getElementById('customAlertModal').classList.add('hidden');
    document.getElementById('customAlertModal').style.display = 'none';
}

let emailToRecover = '';

function forgotPassword() {
    const email = document.getElementById('log-email').value;
    if (!email) {
        const title = translations[currentLang]?.title_email_missing || translations['en']?.title_email_missing || "Email Missing";
        const text = translations[currentLang]?.body_email_missing || translations['en']?.body_email_missing || "Please enter your Email Address in the input field above first.";
        showCustomAlert(title, text);
        return;
    }

    emailToRecover = email;
    const msg = (translations[currentLang]?.recovery_confirm_text || translations['es'].recovery_confirm_text || "¿Enviar correo de recuperación a {email}?").replace('{email}', email);
    document.getElementById('recoveryConfirmText').innerText = msg;

    document.getElementById('recoveryConfirmModal').classList.remove('hidden');
    document.getElementById('recoveryConfirmModal').style.display = 'flex';
}

function closeRecoveryModal() {
    document.getElementById('recoveryConfirmModal').classList.add('hidden');
    document.getElementById('recoveryConfirmModal').style.display = 'none';
}

async function executeRecovery() {
    closeRecoveryModal();
    const email = emailToRecover;

    try {
        logStatus(translations[currentLang].log_requesting_recovery || "Solicitando recuperación de contraseña...", 'warning');
        const res = await fetch('/api/recover-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, lang: currentLang })
        });
        const data = await res.json();
        if (data.success) {
            logStatus((translations[currentLang].log_recovery_sent || "✅ Correo de recuperación enviado a {email} vía SMTP.").replace('{email}', email));
            const title = translations[currentLang]?.title_email_sent || translations['en']?.title_email_sent || "Email Sent!";
            const text = translations[currentLang]?.body_email_sent || translations['en']?.body_email_sent || "An email has been sent with instructions to recover your password.";
            showCustomAlert(title, text, true);
        } else {
            logStatus((translations[currentLang].log_error || "Error: {error}").replace('{error}', getLocalizedApiError(data.error, data.error_code)), 'error');
            const title = translations[currentLang]?.title_error || translations['en']?.title_error || "Error";
            showCustomAlert(title, getLocalizedApiError(data.error, data.error_code));
        }
    } catch (e) {
        logStatus(translations[currentLang].log_net_error_recovery || "Error al conectar con el servidor de recuperación.", 'error');
        const title = translations[currentLang]?.title_connection_error || translations['en']?.title_connection_error || "Connection Error";
        const text = translations[currentLang]?.body_connection_error || translations['en']?.body_connection_error || "Could not contact the server. Please check your internet connection.";
        showCustomAlert(title, text);
    }
}

function closePasswordWarning() {
    document.getElementById('passwordWarningModal').classList.add('hidden');
    document.getElementById('passwordWarningModal').style.display = 'none';
}

async function changePassword() {
    const oldPassword = document.getElementById('session-old-pass').value;
    const newPassword = document.getElementById('session-new-pass').value;

    if (!oldPassword || !newPassword) {
        const title = translations[currentLang]?.title_notice || translations['en']?.title_notice || "Notice";
        const text = translations[currentLang]?.body_fill_fields || translations['en']?.body_fill_fields || "Please fill both fields to change your password.";
        showCustomAlert(title, text);
        return;
    }

    let userName = 'Usuario';
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.first_name) {
        userName = currentUser.first_name;
    } else {
        const email = localStorage.getItem('talkme_email');
        if (email) {
            userName = email.split('@')[0];
            userName = userName.charAt(0).toUpperCase() + userName.slice(1);
        }
    }

    const titleTemplate = (translations[currentLang] && translations[currentLang].warning_title_user) || (translations['es'] && translations['es'].warning_title_user) || `¡Atención {user}!`;
    document.getElementById('passwordWarningTitle').innerText = titleTemplate.replace('{user}', userName);
    document.getElementById('passwordWarningText').innerHTML = (translations[currentLang] && translations[currentLang].password_warning_body) || (translations['es'] && translations['es'].password_warning_body) || "Al actualizar tu contraseña, tu próxima sesión requerirá <strong>conexión a internet</strong> de forma obligatoria para validar las nuevas credenciales.<br><br>¿Deseas continuar?";

    document.getElementById('passwordWarningModal').classList.remove('hidden');
    document.getElementById('passwordWarningModal').style.display = 'flex';
}

async function executeChangePassword() {
    closePasswordWarning();
    const email = localStorage.getItem('talkme_email');
    const oldPassword = document.getElementById('session-old-pass').value;
    const newPassword = document.getElementById('session-new-pass').value;

    try {
        logStatus(translations[currentLang].log_processing_password_change || "Procesando cambio de contraseña...", 'warning');
        const res = await fetch('/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, oldPassword, newPassword })
        });
        const data = await res.json();
        if (data.success) {
            logStatus(translations[currentLang].log_password_changed || "✅ Contraseña modificada correctamente.");
            const titleSuccess = translations[currentLang]?.title_success || translations['en']?.title_success || "Success!";
            const text = translations[currentLang]?.body_password_updated || translations['en']?.body_password_updated || "Password updated successfully.";
            showCustomAlert(titleSuccess, text, true);
            document.getElementById('session-old-pass').value = '';
            document.getElementById('session-new-pass').value = '';
        } else {
            logStatus(`Error: ${getLocalizedApiError(data.error, data.error_code)}`, 'error');
            const titleError = translations[currentLang]?.title_error || translations['en']?.title_error || "Error";
            showCustomAlert(titleError, getLocalizedApiError(data.error, data.error_code));
        }
    } catch (e) {
        logStatus(translations[currentLang].log_net_error_password_change || "Error conectando con el servidor para modificar contraseña.", 'error');
    }
}

function confirmDeleteAccount() {
    document.getElementById('delete-account-password').value = '';
    document.getElementById('deleteAccountConfirmModal').classList.remove('hidden');
    document.getElementById('deleteAccountConfirmModal').style.display = 'flex';
}

function closeDeleteAccountModal() {
    document.getElementById('deleteAccountConfirmModal').classList.add('hidden');
    document.getElementById('deleteAccountConfirmModal').style.display = 'none';
}

async function executeDeleteAccount() {
    const password = document.getElementById('delete-account-password').value;
    if (!password) {
        const title = translations[currentLang]?.title_notice || translations['en']?.title_notice || "Aviso";
        const text = translations[currentLang]?.body_fill_fields || translations['en']?.body_fill_fields || "Por favor, introduce tu contraseña.";
        showCustomAlert(title, text);
        return;
    }

    closeDeleteAccountModal();
    const email = localStorage.getItem('talkme_email');

    try {
        logStatus(translations[currentLang]?.log_processing_delete || "Procesando eliminación de cuenta...", 'warning');
        const res = await fetch('/api/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            logStatus(translations[currentLang]?.log_account_deleted || "✅ Cuenta eliminada correctamente.");
            const titleSuccess = translations[currentLang]?.title_success || translations['en']?.title_success || "¡Éxito!";
            const text = translations[currentLang]?.body_account_deleted || translations['en']?.body_account_deleted || "Tu cuenta ha sido eliminada.";
            showCustomAlert(titleSuccess, text, true);
            setTimeout(() => {
                confirmLogout(); // Desloguea al usuario automáticamente
            }, 2000);
        } else {
            logStatus(`Error: ${getLocalizedApiError(data.error, data.error_code)}`, 'error');
            const titleError = translations[currentLang]?.title_error || translations['en']?.title_error || "Error";
            showCustomAlert(titleError, getLocalizedApiError(data.error, data.error_code));
        }
    } catch (e) {
        logStatus(translations[currentLang]?.log_net_error_delete || "Error conectando con el servidor para eliminar la cuenta.", 'error');
    }
}

const allSpeechLanguages = [
    { code: 'es', type: 'Vosk', size: '40 MB' },
    { code: 'en', type: 'Vosk', size: '40 MB' },
    { code: 'eu', type: 'Whisper-cpp', size: '140 MB' },
    { code: 'de', type: 'Vosk', size: '40 MB' },
    { code: 'ar', type: 'Vosk', size: '40 MB' },
    { code: 'ca', type: 'Vosk', size: '40 MB' },
    { code: 'zh', type: 'Vosk', size: '40 MB' },
    { code: 'ko', type: 'Vosk', size: '40 MB' },
    { code: 'eo', type: 'Vosk', size: '40 MB' },
    { code: 'fa', type: 'Vosk', size: '40 MB' },
    { code: 'fr', type: 'Vosk', size: '40 MB' },
    { code: 'gl', type: 'Whisper-cpp', size: '140 MB' },
    { code: 'nl', type: 'Vosk', size: '40 MB' },
    { code: 'it', type: 'Vosk', size: '40 MB' },
    { code: 'ja', type: 'Vosk', size: '40 MB' },
    { code: 'kk', type: 'Vosk', size: '40 MB' },
    { code: 'pl', type: 'Vosk', size: '40 MB' },
    { code: 'pt', type: 'Vosk', size: '40 MB' },
    { code: 'ru', type: 'Vosk', size: '40 MB' },
    { code: 'sv', type: 'Vosk', size: '40 MB' },
    { code: 'tr', type: 'Vosk', size: '40 MB' },
    { code: 'uk', type: 'Vosk', size: '40 MB' },
    { code: 'uz', type: 'Vosk', size: '40 MB' },
    { code: 'vi', type: 'Vosk', size: '40 MB' }
];

const languageNames = {
    es: {
        de: "Alemán", ar: "Árabe", ca: "Catalán", zh: "Chino", ko: "Coreano",
        eu: "Euskera", es: "Español", eo: "Esperanto", fa: "Persa", fr: "Francés",
        gl: "Gallego", nl: "Neerlandés", en: "Inglés", it: "Italiano", ja: "Japonés",
        kk: "Kazajo", pl: "Polaco", pt: "Portugués", ru: "Ruso", sv: "Sueco",
        tr: "Turco", uk: "Ucraniano", uz: "Uzbeko", vi: "Vietnamita"
    },
    en: {
        de: "German", ar: "Arabic", ca: "Catalan", zh: "Chinese", ko: "Korean",
        eu: "Basque", es: "Spanish", eo: "Esperanto", fa: "Persian", fr: "French",
        gl: "Galician", nl: "Dutch", en: "English", it: "Italian", ja: "Japanese",
        kk: "Kazakh", pl: "Polish", pt: "Portuguese", ru: "Russian", sv: "Swedish",
        tr: "Turkish", uk: "Ukrainian", uz: "Uzbek", vi: "Vietnamese"
    },
    eu: {
        de: "Alemana", ar: "Arabiera", ca: "Katalana", zh: "Txinera", ko: "Koreera",
        eu: "Euskara", es: "Gaztelania", eo: "Esperantoa", fa: "Persiera", fr: "Frantsesa",
        gl: "Galiziera", nl: "Nederlandera", en: "Ingelesa", it: "Italiera", ja: "Japoniera",
        kk: "Kazajistanera", pl: "Poloniera", pt: "Portugesa", ru: "Errusiera", sv: "Suediera",
        tr: "Turkiera", uk: "Ukrainera", uz: "Uzbekera", vi: "Vietnamera"
    }
};

function getLanguageName(code, lang) {
    if (lang === 'eu' && code === 'eu') {
        return "Euskara";
    }
    const currentDict = languageNames[lang] || languageNames['es'];
    if (currentDict && currentDict[code]) {
        return currentDict[code];
    }
    try {
        const displayNames = new Intl.DisplayNames([lang], { type: 'language' });
        let name = displayNames.of(code);
        if (name) {
            return name.charAt(0).toUpperCase() + name.slice(1);
        }
    } catch (e) {
        // Fallback below
    }
    return code.toUpperCase();
}

async function selectModelsPath(context = 'tab') {
    let btn;
    if (context === 'modal') {
        btn = document.querySelector('#translateModelsPathSelector button');
    } else if (context === 'translate') {
        btn = document.querySelector('#prelaunch-tab-translation .btn-select-path');
    } else {
        btn = document.querySelector('#prelaunch-tab-engines .btn-select-path');
    }
    const originalText = btn ? btn.innerText : '';
    if (btn) {
        btn.disabled = true;
        btn.innerText = '⏳';
    }

    const syncPathInputs = (path) => {
        const inpTab = document.getElementById('inputModelsPath');
        const inpModal = document.getElementById('inputModelsPathModal');
        const inpTrans = document.getElementById('inputTranslateModelsPath');
        if (inpTab) inpTab.value = path;
        if (inpModal) inpModal.value = path;
        if (inpTrans) inpTrans.value = path;
        localStorage.setItem('talkme_models_path', path);
    };

    try {
        if (window.electronAPI && window.electronAPI.selectFolder) {
            const path = await window.electronAPI.selectFolder();
            if (path) {
                syncPathInputs(path);
                logStatus((translations[currentLang].log_path_set || '📂 Path set: {path}').replace('{path}', path), 'success');
                checkPrelaunchTabModels();
            }
            return;
        } else if (window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            const path = await ipcRenderer.invoke('select-folder-dialog');
            if (path) {
                syncPathInputs(path);
                logStatus((translations[currentLang].log_path_set || '📂 Path set: {path}').replace('{path}', path), 'success');
                checkPrelaunchTabModels();
            }
            return;
        }

        // Web Client Fallback: Call our local Node.js server select-folder endpoint
        const res = await fetch('/api/select-folder', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.path) {
            syncPathInputs(data.path);
            logStatus((translations[currentLang].log_path_set || '📂 Path set: {path}').replace('{path}', data.path), 'success');
            checkPrelaunchTabModels();
        }
    } catch (e) {
        const currentPath = (document.getElementById('inputModelsPathModal') && document.getElementById('inputModelsPathModal').value) ||
            (document.getElementById('inputModelsPath') && document.getElementById('inputModelsPath').value) ||
            'C:\\\\TalkMe\\\\Models';
        const t = translations[currentLang] || translations['en'];
        const newPath = prompt(t.prompt_models_path || 'Enter the models storage path:', currentPath);
        if (newPath !== null && newPath.trim() !== '') {
            syncPathInputs(newPath);
            logStatus((translations[currentLang].log_path_set || '📂 Path set: {path}').replace('{path}', newPath), 'success');
            checkPrelaunchTabModels();
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}

function renderSpeechModels(installedMap) {
    const container = document.getElementById('prelaunch-engines-list');
    if (!container) return;

    const modelsList = allSpeechLanguages.map(lang => {
        let installed = !!installedMap[lang.code];
        return { ...lang, installed };
    });

    // Sort: installed models always at the top, then the active interface language, then alphabetically
    modelsList.sort((a, b) => {
        // 1. Installed models first
        if (a.installed && !b.installed) return -1;
        if (!a.installed && b.installed) return 1;

        // 2. Active interface language next (if not installed)
        const isCurrentA = a.code === currentLang;
        const isCurrentB = b.code === currentLang;
        if (isCurrentA && !isCurrentB) return -1;
        if (!isCurrentA && isCurrentB) return 1;

        // 3. Alphabetical order
        const nameA = getLanguageName(a.code, currentLang);
        const nameB = getLanguageName(b.code, currentLang);
        return nameA.localeCompare(nameB);
    });

    // Filtro de idiomas estilo Google Traductor (Simple)
    const filterInput = document.getElementById('engineFilterInput');
    const query = filterInput ? filterInput.value.toLowerCase().trim() : '';

    const filteredList = modelsList.filter(m => {
        const name = getLanguageName(m.code, currentLang).toLowerCase();
        const code = m.code.toLowerCase();
        const type = m.type.toLowerCase();
        return name.includes(query) || code.includes(query) || type.includes(query);
    });

    if (filteredList.length === 0) {
        container.innerHTML = '';
        return;
    }

    const t = translations[currentLang] || translations['en'];
    const toInstallTxt = t.btn_download || 'Install';
    const installedTxt = t.installed || 'Installed';
    const deleteTxt = t.btn_delete || 'Delete';
    const cancelTxt = t.btn_cancel || 'Cancel';

    const crossSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="engine-cross-svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    container.innerHTML = filteredList.map(m => {
        const name = getLanguageName(m.code, currentLang);
        // Mostrar siempre solo el tamaño en MB (sin "Whisper-cpp • " ni "Vosk")
        const sizeText = m.size;
        // If currently downloading, show cancel button
        const isDownloading = !!downloadIntervals[m.code];
        const actionBtn = isDownloading
            ? `<button class="btn-engine-status downloading" id="btn-${m.code}-action" onclick="cancelDownload('${m.code}')">
                 <span class="status-text" style="display: flex; align-items: center; justify-content: center;">${crossSvg}${cancelTxt}</span>
               </button>`
            : (m.installed
                ? `<button class="btn-engine-status installed" id="btn-${m.code}-action" onclick="deleteModel('${m.code}')">
                 <span class="status-text">${installedTxt}</span>
                 <span class="hover-text">${deleteTxt}</span>
               </button>`
                : `<button class="btn-engine-status not-installed" id="btn-${m.code}-action" onclick="downloadModel('${m.code}')">
                 ${toInstallTxt}
               </button>`);

        return `
            <div class="engine-card">
                <div class="engine-card-left">
                    <span class="engine-card-badge">${m.code}</span>
                    <div class="engine-card-info">
                        <span class="engine-card-name">${name}</span>
                        <span class="engine-card-size">${sizeText}</span>
                    </div>
                </div>
                
                <div id="engine-${m.code}-progress-box" class="engine-progress-box" style="display: ${isDownloading ? 'block' : 'none'};">
                    <div class="engine-progress-labels">
                        <span id="engine-${m.code}-speed">0 KB/s</span>
                        <span id="engine-${m.code}-bytes">0/0 MB</span>
                    </div>
                    <div class="engine-progress-track">
                        <div id="engine-${m.code}-progress-bar" class="engine-progress-fill" style="width: 0%;"></div>
                    </div>
                </div>

                <div id="engine-${m.code}-action-area">
                    ${actionBtn}
                </div>
            </div>
        `;
    }).join('');
}

let downloadIntervals = {};

function setButtonDownloading(model) {
    const t = translations[currentLang] || translations['en'];
    const cancelTxt = t.btn_cancel || 'Cancel';
    const crossSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px; display: inline-block; vertical-align: -1px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    const btn = document.getElementById(`btn-${model}-action`);
    if (btn) {
        btn.className = 'btn-engine-status downloading';
        btn.innerHTML = `<span class="status-text" style="display: flex; align-items: center; justify-content: center;">${crossSvg}${cancelTxt}</span>`;
        btn.onclick = () => cancelDownload(model);
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

function setButtonInstall(model) {
    const t = translations[currentLang] || translations['en'];
    const toInstallTxt = t.btn_download || 'Install';
    const btn = document.getElementById(`btn-${model}-action`);
    if (btn) {
        btn.className = 'btn-engine-status not-installed';
        btn.innerHTML = toInstallTxt;
        btn.onclick = () => downloadModel(model);
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

function cancelDownload(model) {
    if (downloadIntervals[model]) {
        clearInterval(downloadIntervals[model]);
        delete downloadIntervals[model];
    }
    // For real backend downloads, signal cancellation (best-effort)
    if (model === 'es' || model === 'en' || model === 'eu') {
        fetch('/api/cancel-download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model })
        }).catch(() => { }); // Best effort — no UI block on failure
    }
    const progressBox = document.getElementById(`engine-${model}-progress-box`);
    if (progressBox) progressBox.style.display = 'none';
    setButtonInstall(model);
    logStatus((currentLang === 'es'
        ? `Descarga de '${model.toUpperCase()}' cancelada.`
        : `Download of '${model.toUpperCase()}' cancelled.`), 'warning');
}

function getLocalizedModelStatus(statusType, modelCode) {
    const langName = getLanguageName(modelCode, currentLang) || modelCode.toUpperCase();
    const dict = translations[currentLang] || translations['es'] || {};

    if (statusType === 'ready') {
        const template = dict.log_model_ready_disk || "✔️ Modelo de voz para [{model}] listo en disco.";
        return template.replace('{model}', langName.toUpperCase());
    } else if (statusType === 'downloading') {
        const template = dict.log_model_download_started || "🎙️ Iniciando descarga de modelo de voz para [{model}]...";
        return template.replace('{model}', langName.toUpperCase());
    } else if (statusType === 'completed') {
        const template = dict.log_model_installed || "✔️ Modelo de voz para [{model}] descargado e instalado en disco con éxito.";
        return template.replace('{model}', langName.toUpperCase());
    }
    return '';
}

async function downloadModel(model) {
    clearEngineFilter();

    try {
        const modelsPath = getEffectiveModelsPath();

        // 1. Pre-comprobación: Si el modelo ya existe localmente, notificar al status-panel de inmediato
        try {
            const checkRes = await fetch(`/api/check-models?customPath=${encodeURIComponent(modelsPath)}`);
            const checkData = await checkRes.json();
            if (checkData.success && checkData.models && checkData.models[model]) {
                logStatus(getLocalizedModelStatus('ready', model));
                checkSpeechModels();
                return;
            }
        } catch (checkErr) { }

        const progressBox = document.getElementById(`engine-${model}-progress-box`);
        if (progressBox) progressBox.style.display = 'block';
        setButtonDownloading(model);

        logStatus(getLocalizedModelStatus('downloading', model), 'warning');

        const res = await fetch('/api/download-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, customPath: modelsPath })
        });
        const data = await res.json();

        if (data.success) {
            if (!downloadIntervals[model]) {
                downloadIntervals[model] = setInterval(() => pollDownloadProgress(model), 1000);
            }
        } else {
            logStatus(getLocalizedApiError(data.error, data.error_code) || 'Error starting download', 'error');
            if (progressBox) progressBox.style.display = 'none';
            setButtonInstall(model);
        }
    } catch (e) {
        logStatus('Error de red al iniciar la descarga del modelo', 'error');
        const progressBox = document.getElementById(`engine-${model}-progress-box`);
        if (progressBox) progressBox.style.display = 'none';
        setButtonInstall(model);
    }
}

async function pollDownloadProgress(model) {
    try {
        const res = await fetch('/api/download-progress');
        const data = await res.json();
        if (data.success && data.downloads && data.downloads[model]) {
            const dl = data.downloads[model];

            document.getElementById(`engine-${model}-speed`).innerText = dl.speed;
            document.getElementById(`engine-${model}-bytes`).innerText = `${dl.downloaded} / ${dl.total}`;
            document.getElementById(`engine-${model}-progress-bar`).style.width = `${dl.progress}%`;

            if (dl.status === 'completed' || dl.progress >= 100) {
                clearInterval(downloadIntervals[model]);
                delete downloadIntervals[model];

                const progressBox = document.getElementById(`engine-${model}-progress-box`);
                if (progressBox) progressBox.style.display = 'none';

                logStatus(getLocalizedModelStatus('completed', model));

                checkSpeechModels();
                checkPrelaunchTabModels();
            } else if (dl.status === 'failed') {
                clearInterval(downloadIntervals[model]);
                delete downloadIntervals[model];
                document.getElementById(`engine-${model}-progress-box`).style.display = 'none';
                setButtonInstall(model);
                logStatus((translations[currentLang].log_model_download_failed || "Descarga de modelo '{model}' fallida.").replace('{model}', model.toUpperCase()), 'error');
            }
        }
    } catch (e) {
        console.error("Error polling progress", e);
    }
}

async function deleteModel(model) {
    const confirmMsg = (translations[currentLang].confirm_delete_model || "Are you sure you want to delete model '{model}' physically from disk?").replace('{model}', model.toUpperCase());

    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        const modelsPath = getEffectiveModelsPath();
        const res = await fetch('/api/delete-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, customPath: modelsPath })
        });
        const data = await res.json();

        if (data.success) {
            logStatus((translations[currentLang].log_model_deleted || "Model '{model}' physically deleted to free space.").replace('{model}', model.toUpperCase()));

            checkPrelaunchTabModels();
        } else {
            logStatus(getLocalizedApiError(data.error, data.error_code) || 'Error deleting model', 'error');
        }
    } catch (e) {
        logStatus('Network error deleting model', 'error');
    }
}

async function checkPrelaunchTabModels() {
    const cachedPath = getEffectiveModelsPath();
    const inputEl = document.getElementById('inputModelsPath');
    if (inputEl) {
        inputEl.value = cachedPath;
    }

    try {
        const res = await fetch(`/api/check-models?customPath=${encodeURIComponent(cachedPath)}`);
        const data = await res.json();
        if (data.success && data.models) {
            lastModelsData = data.models;
            renderSpeechModels(data.models);
        } else {
            lastModelsData = {};
            renderSpeechModels({});
        }
    } catch (e) {
        lastModelsData = {};
        renderSpeechModels({});
    }

    // Keep the ignition room pre-flight checklist updated as well
    checkSpeechModels();
}

async function loadTelemetryHistory() {
    const tbody = document.getElementById('prelaunch-history-body');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 30px 12px; color: rgba(255,255,255,0.3);">&#x1F504; Cargando...</td></tr>`;
    try {
        const res = await fetch('/api/session-history');
        const data = await res.json();
        const statsBar = document.getElementById('history-stats-bar');

        if (data.success && data.history && data.history.length > 0) {
            tbody.innerHTML = '';

            // Calcular totales para el stats bar
            const totalSessions = data.history.length;
            const totalMsgs = data.history.reduce((a, r) => a + (r.msg_count || 0), 0);
            const totalMins = data.history.reduce((a, r) => a + (r.duration_mins || 0), 0);
            const totalHermes = data.history.reduce((a, r) => a + (r.hermes_msg_count || 0), 0);
            const allLangs = [...new Set(data.history.flatMap(r => (r.languages && r.languages !== '-') ? r.languages.split(', ') : []))];

            if (statsBar) {
                statsBar.style.display = 'flex';
                statsBar.innerHTML = [
                    { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`, value: totalSessions },
                    { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`, value: totalMins + 'm' },
                    { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`, value: totalMsgs },
                    { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`, value: totalHermes },
                    { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`, value: allLangs.length > 0 ? allLangs.join(', ') : '-' }
                ].map(s => `<div style="background: rgba(108,92,231,0.1); border: 1px solid rgba(108,92,231,0.22); border-radius: 7px; padding: 5px 9px; display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-flex; align-items: center;">${s.icon}</span>
                    <span style="font-size: 11px; font-weight: 700; color: #fff; line-height: 1;">${s.value}</span>
                </div>`).join('');
            }

            data.history.forEach((row, idx) => {
                const isEven = idx % 2 === 0;

                const langHtml = (row.languages && row.languages !== '-')
                    ? row.languages.split(', ').map(l => `<span style="background: rgba(108,92,231,0.18); color: #c4b5fd; border-radius: 3px; padding: 0 4px; font-size: 9px; margin-right: 1px; display: inline-block;">${l.trim()}</span>`).join('')
                    : '<span style="opacity: 0.25; font-size: 9px;">-</span>';

                let tArr = Array.isArray(row.translations_used) ? row.translations_used : (row.translations_used ? row.translations_used.split(', ') : []);
                const transHtml = (tArr && tArr.length > 0 && tArr[0] !== '-')
                    ? tArr.map(t => `<span style="border: 1px solid rgba(16,185,129,0.3); color: #10b981; border-radius: 3px; padding: 0 3px; font-size: 9px; margin-right: 1px; display: inline-block;">${t.trim()}</span>`).join('')
                    : '<span style="opacity: 0.25; font-size: 9px;">-</span>';

                // Formato de fecha compacto: dd/mm HH:MM
                let dateStr = row.timestamp || '-';
                try {
                    if (row.timestamp && row.timestamp !== '-') {
                        const d = new Date(row.timestamp);
                        if (!isNaN(d)) {
                            dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        }
                    }
                } catch (e) { }

                const tr = document.createElement('tr');
                tr.style.cssText = `background: ${isEven ? 'rgba(255,255,255,0.018)' : 'transparent'}; transition: background 0.12s;`;
                tr.onmouseover = () => tr.style.background = 'rgba(108,92,231,0.07)';
                tr.onmouseout = () => tr.style.background = isEven ? 'rgba(255,255,255,0.018)' : 'transparent';

                // Celda compacta con overflow hidden para table-layout: fixed
                const C = (content, align = 'center', extra = '') =>
                    `<td style="padding: 7px 4px; border-bottom: 1px solid rgba(255,255,255,0.035); text-align: ${align}; overflow: hidden; ${extra}">${content}</td>`;

                tr.innerHTML =
                    C(`<span style="color: rgba(255,255,255,0.55); font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${dateStr}</span>`, 'left', 'padding-left: 10px;') +
                    C(`<span style="color: #a78bfa; font-weight: 700; font-size: 10px;">${row.duration_mins || 0}m</span>`) +
                    C(`<span style="color: #60efff; font-size: 10px;">${row.users_connected || 0}</span>`) +
                    C(`<span style="color: #60efff; opacity: 0.65; font-size: 10px;">${row.subusers_connected || 0}</span>`) +
                    C(`<span style="color: #fbbf24; font-size: 10px;">${row.filters_used || 0}</span>`) +
                    C(`<span style="color: #34d399; font-weight: 600; font-size: 10px;">${row.msg_count || 0}</span>`) +
                    C(`<span style="color: #f472b6; font-size: 10px;">${row.trigger_count || 0}</span>`) +
                    C(`<span style="color: var(--accent-primary); font-weight: 700; font-size: 10px;">${row.hermes_msg_count || 0}</span>`) +
                    C(`<span style="color: #fb923c; font-size: 10px;">${row.photos_taken || 0}</span>`) +
                    C(`<span style="color: #a78bfa; font-size: 10px;">${row.text_msg_count || 0}</span>`) +
                    C(`<span style="color: #a78bfa; opacity: 0.7; font-size: 10px;">${row.audio_msg_count || 0}</span>`) +
                    C(transHtml, 'left', 'padding-right: 4px;') +
                    C(langHtml, 'left', 'padding-right: 10px;');

                tbody.appendChild(tr);
            });
        } else {
            if (statsBar) statsBar.style.display = 'none';
            tbody.innerHTML = '';
        }
    } catch (e) {
        console.error("Error loading telemetry", e);
        if (statsBar) statsBar.style.display = 'none';
        tbody.innerHTML = '';
    }
}

function filterSpeechModels() {
    const filterInput = document.getElementById('engineFilterInput');
    const clearBtn = document.getElementById('btnClearFilter');
    if (filterInput && clearBtn) {
        clearBtn.style.display = filterInput.value.length > 0 ? 'flex' : 'none';
    }
    renderSpeechModels(lastModelsData);
}

function clearEngineFilter() {
    const filterInput = document.getElementById('engineFilterInput');
    if (filterInput) {
        filterInput.value = '';
    }
    filterSpeechModels();
}

function togglePlanCard(headerEl) {
    const card = headerEl.closest('.plan-card');
    if (!card) return;
    const container = card.parentElement;
    const allCards = container.querySelectorAll('.plan-card');

    allCards.forEach(c => {
        if (c === card) {
            c.classList.toggle('active');
        } else {
            c.classList.remove('active');
        }
    });
}

// [v60.Murphy] Cache en memoria defensivo por si localStorage está inhabilitado/lleno
window._termsMemoryCache = window._termsMemoryCache || {};

// Variable de control para evitar race conditions por clics repetidos
let _termsFetchController = null;

function _safeGetTermsCache(key) {
    try {
        return localStorage.getItem(key) || window._termsMemoryCache[key] || null;
    } catch (e) {
        return window._termsMemoryCache[key] || null;
    }
}

function _safeSetTermsCache(key, val) {
    try {
        localStorage.setItem(key, val);
    } catch (e) { }
    window._termsMemoryCache[key] = val;
}

function _extractTermsLangBlock(html, lang) {
    if (!html || typeof html !== 'string') return null;
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Sanitización defensiva básica: remover scripts o iframes
        doc.querySelectorAll('script, iframe').forEach(el => el.remove());
        const langBlock = doc.querySelector(`[lang="${lang}"]`) || doc.querySelector('[lang="es"]');
        if (langBlock) {
            langBlock.style.display = '';
            return langBlock.outerHTML;
        }
        return html; // fallback mostrar todo si no hay selector de idioma
    } catch (e) {
        return null;
    }
}

async function openLauncherTermsModal(e, tipo) {
    if (e) e.preventDefault();
    const modal = document.getElementById('launcherTermsModal');
    const contentArea = document.getElementById('launcherTermsContentArea');
    const titleEl = modal ? modal.querySelector('.modal-title-small') : null;
    if (!modal) return;

    const tipoFinal = tipo || 'registro';
    const archivoTerms = tipoFinal === 'app' ? 'terms-app.html' : '/api/terms-registro';
    const cacheKey = `talkme_terms_cache_${tipoFinal}`;
    const activeLang = currentLang || 'es';

    // Título del modal en el idioma activo
    const t = translations[activeLang] || translations['es'];
    let tituloModal = 'Términos de Uso y Licencia';
    if (tipoFinal === 'app') {
        const uso = t.terms_link_uso || "Términos de Uso";
        tituloModal = uso.charAt(0).toUpperCase() + uso.slice(1);
    } else {
        const uso = t.terms_link_uso || "Términos de Uso";
        const and = t.terms_and || "y";
        const lic = t.terms_link_licencia || "Condiciones de Licencia";
        tituloModal = `${uso.charAt(0).toUpperCase() + uso.slice(1)} ${and} ${lic}`;
    }

    if (titleEl) titleEl.textContent = tituloModal;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // ── NIVEL 1: Carga Inmediata 0 ms (Offline-First Blindado) ──
    const cachedHtml = _safeGetTermsCache(cacheKey);
    let renderedImmediately = false;

    if (cachedHtml) {
        const renderedBlock = _extractTermsLangBlock(cachedHtml, activeLang);
        if (renderedBlock) {
            contentArea.innerHTML = renderedBlock;
            renderedImmediately = true;
        }
    }

    if (!renderedImmediately) {
        // Si no hay caché, cargar de inmediato el archivo local empaquetado de serie
        try {
            const localFile = tipoFinal === 'app' ? 'terms-app.html' : 'terms-registro.html';
            const localRes = await fetch(localFile);
            if (localRes.ok) {
                const localHtml = await localRes.text();
                _safeSetTermsCache(cacheKey, localHtml);
                const localBlock = _extractTermsLangBlock(localHtml, activeLang);
                if (localBlock) {
                    contentArea.innerHTML = localBlock;
                    renderedImmediately = true;
                }
            }
        } catch (localErr) {
            console.warn("⚠️ [TermsModal] Error cargando copia local de serie:", localErr);
        }
    }

    // Si aún no se pudo pintar, mostrar placeholder temporal neutral (nunca error)
    if (!renderedImmediately && (!contentArea.innerHTML || contentArea.innerHTML.trim() === '')) {
        contentArea.innerHTML = '<p style="color: rgba(255,255,255,0.4); text-align: center; padding: 20px;">Cargando términos...</p>';
    }

    // ── NIVEL 2: Sondeo Silencioso en Background con AbortController (3.5s) y Anti-Caché ──
    if (_termsFetchController) {
        try { _termsFetchController.abort(); } catch (e) { }
    }
    _termsFetchController = new AbortController();
    const timeoutId = setTimeout(() => {
        try { _termsFetchController.abort(); } catch (e) { }
    }, 3500);

    fetch(`${archivoTerms}?_t=${Date.now()}`, {
        cache: 'no-store',
        signal: _termsFetchController.signal
    })
        .then(async (res) => {
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        })
        .then((remoteHtml) => {
            // ── NIVEL 3: Validación de Integridad y Actualización Suave ──
            if (remoteHtml && typeof remoteHtml === 'string' && remoteHtml.length > 200) {
                const currentCached = _safeGetTermsCache(cacheKey);
                if (remoteHtml !== currentCached) {
                    _safeSetTermsCache(cacheKey, remoteHtml);
                    const updatedBlock = _extractTermsLangBlock(remoteHtml, activeLang);
                    if (updatedBlock) {
                        contentArea.innerHTML = updatedBlock;
                        console.log(`✅ [TermsModal] Términos (${tipoFinal}) actualizados dinámicamente desde repositorio central.`);
                    }
                }
            }
        })
        .catch((err) => {
            clearTimeout(timeoutId);
            // Silencio absoluto ante cortes de red o timeout: el usuario continúa leyendo la copia local sana
        });
}

function closeLauncherTermsModal(accept) {
    const modal = document.getElementById('launcherTermsModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    if (accept) {
        const checkbox = document.getElementById('reg-terms-check');
        if (checkbox) checkbox.checked = true;
    }
}

function filterPrelaunchGuide() {
    const input = document.getElementById('prelaunchGuideFilterInput');
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    const cards = document.querySelectorAll('#prelaunch-tab-guide .guide-card');
    let totalVisible = 0;
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const matches = query === '' || text.includes(query);
        if (matches) {
            card.style.display = 'flex';
            totalVisible++;
        } else {
            card.style.display = 'none';
        }
    });

    // Control reactivo del empty state de la guía en pre-launch
    const emptyState = document.getElementById('prelaunchGuideEmptyState');
    if (emptyState) {
        emptyState.style.display = (totalVisible === 0 && query !== '') ? 'block' : 'none';
    }
}

function filterPrelaunchLegal() {
    const input = document.getElementById('prelaunchLegalFilterInput');
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    const container = document.getElementById('prelaunchLegalContainer');
    if (!container) return;

    const cards = container.querySelectorAll('.legal-card');
    let totalVisible = 0;
    const sectionCounts = { copyright: 0, ai: 0, npm: 0, licenses: 0 };

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const matches = query === '' || text.includes(query);
        card.style.display = matches ? '' : 'none';
        if (matches) {
            totalVisible++;
            const sec = card.dataset.legalSection;
            if (sec && sectionCounts[sec] !== undefined) {
                sectionCounts[sec]++;
            }
        }
    });

    // Controlar visibilidad de los encabezados de sección
    const aiHeader = container.querySelector('[data-legal-header="ai"]');
    if (aiHeader) aiHeader.style.display = sectionCounts.ai > 0 ? 'flex' : 'none';

    const npmHeader = container.querySelector('[data-legal-header="npm"]');
    const npmGrid = container.querySelector('[data-legal-group="npm"]');
    if (npmHeader) npmHeader.style.display = sectionCounts.npm > 0 ? 'flex' : 'none';
    if (npmGrid) npmGrid.style.display = sectionCounts.npm > 0 ? 'grid' : 'none';

    const licHeader = container.querySelector('[data-legal-header="licenses"]');
    if (licHeader) licHeader.style.display = sectionCounts.licenses > 0 ? 'flex' : 'none';

    // Estado vacío si no hay coincidencias
    const emptyState = document.getElementById('prelaunchLegalEmptyState');
    if (emptyState) {
        emptyState.style.display = (totalVisible === 0 && query !== '') ? 'block' : 'none';
    }
}

// ══ CUSTOM FLOATING TOOLTIP ENGINE ══
(function initTalkmeTooltip() {
    // Create tooltip DOM element
    const tip = document.createElement('div');
    tip.id = 'talkme-tooltip';
    document.body.appendChild(tip);

    let hideTimer = null;

    function showTip(text, x, y) {
        clearTimeout(hideTimer);
        tip.textContent = text;
        // Position: 12px above cursor, clamp to viewport
        const vw = window.innerWidth;
        let left = x + 12;
        let top = y - 32;
        tip.style.left = '0px';
        tip.style.top = '0px';
        tip.classList.add('visible');
        // After paint, adjust if overflowing right edge
        const tw = tip.offsetWidth;
        if (left + tw > vw - 8) left = x - tw - 12;
        if (top < 4) top = y + 18;
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
    }

    function hideTip() {
        tip.classList.remove('visible');
    }

    // Use event delegation on document for dynamic elements
    document.addEventListener('mousemove', function (e) {
        const el = e.target.closest('[data-i18n-title]');
        if (el) {
            // Get translated text from data-i18n-title key
            const key = el.getAttribute('data-i18n-title');
            const lang = (typeof currentLang !== 'undefined') ? currentLang : 'es';
            let text = null;
            if (typeof translations !== 'undefined') {
                if (translations[lang] && translations[lang][key]) {
                    text = translations[lang][key];
                } else if (translations['en'] && translations['en'][key]) {
                    text = translations['en'][key];
                } else if (translations['es'] && translations['es'][key]) {
                    text = translations['es'][key];
                }
            }
            if (!text) text = el.getAttribute('title') || key;
            if (text) showTip(text, e.clientX, e.clientY);
        } else {
            hideTip();
        }
    }, { passive: true });

    document.addEventListener('mouseleave', hideTip, { passive: true });
    document.addEventListener('scroll', hideTip, { passive: true, capture: true });
})();


/**
 * 📖 Sistema de Guía de Usuario Dinámica de Pre-Launch (24 Idiomas)
 * Patrón "Stale-While-Revalidate" con Blindaje Murphy Offline-First:
 * Nivel 1: Lectura inmediata (0ms) desde caché en localStorage o paquete local empaquetado.
 * Nivel 2: Verificación asíncrona en segundo plano hacia https://www.talk-me.app/locales/guide/{lang}.json (3s timeout).
 * Nivel 3: Validación de integridad JSON y actualización suave de interfaz sin parpadeos.
 */
async function loadPrelaunchGuide(lang) {
    const container = document.getElementById('prelaunchGuideContainer');
    if (!container) return;

    lang = lang.toLowerCase();

    // ── NIVEL 1: Carga inteligente con validación de versión empaquetada ──
    const cacheKey = `talkme_guide_cache_${lang}`;
    const CURRENT_PACKAGED_VERSION = '60.2.0';
    let cachedGuide = null;
    try {
        const rawCached = localStorage.getItem(cacheKey);
        if (rawCached) {
            const parsed = JSON.parse(rawCached);
            // Si la copia en localStorage es anterior a la empaquetada, se invalida
            if (parsed && Array.isArray(parsed.cards) && parsed.guide_version === CURRENT_PACKAGED_VERSION) {
                cachedGuide = parsed;
            }
        }
    } catch (e) { }

    // Si tenemos versión en caché válida, renderizarla de inmediato
    if (cachedGuide) {
        renderPrelaunchGuide(cachedGuide, container, lang);
    } else {
        container.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 0.9rem; text-align: center; padding: 20px;">Cargando guía...</div>';
        try {
            const res = await fetch(`./locales/guide/${lang}.json?_v=${Date.now()}`);
            if (!res.ok) throw new Error('Local guide not found');
            const guideData = await res.json();
            renderPrelaunchGuide(guideData, container, lang);
            try { localStorage.setItem(cacheKey, JSON.stringify(guideData)); } catch (e) { }
        } catch (err) {
            try {
                const resEs = await fetch(`./locales/guide/es.json?_v=${Date.now()}`);
                const guideDataEs = await resEs.json();
                renderPrelaunchGuide(guideDataEs, container, 'es');
            } catch (fallbackErr) {
                container.innerHTML = '<div style="color: #ff6b35; font-size: 0.9rem; text-align: center; padding: 20px;">Error loading guide.</div>';
            }
        }
    }

    // ── NIVEL 2: Sondeo en segundo plano hacia el servidor central (FTP) ──
    const remoteUrl = `https://www.talk-me.app/locales/guide/${lang}.json?_t=${Date.now()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    fetch(remoteUrl, { cache: 'no-store', signal: controller.signal })
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(remoteData => {
            clearTimeout(timeoutId);
            // ── NIVEL 3: Validación de integridad y actualización (Solo si el remoto no es más antiguo) ──
            if (remoteData && Array.isArray(remoteData.cards) && remoteData.cards.length > 0) {
                // Si el servidor remoto aún no se ha subido y tiene versión inferior, NO degradar
                if (remoteData.guide_version && remoteData.guide_version < CURRENT_PACKAGED_VERSION) {
                    return;
                }
                const remoteStr = JSON.stringify(remoteData);
                const currentStr = localStorage.getItem(cacheKey);
                if (remoteStr !== currentStr) {
                    try { localStorage.setItem(cacheKey, remoteStr); } catch (e) { }
                    if (container.dataset.renderedLang === lang) {
                        renderPrelaunchGuide(remoteData, container, lang);
                        console.log(`[Launchpad] Guía (${lang}) actualizada desde repositorio central.`);
                    }
                }
            }
        })
        .catch(err => {
            clearTimeout(timeoutId);
            // Murphy Mitigation: Silencio absoluto si estamos offline, modo avión o fallo de red
        });
}

function renderPrelaunchGuide(guideData, container, lang) {
    container.innerHTML = '';
    container.dataset.renderedLang = lang;

    const cardsList = guideData.cards || [];
    const net = guideData.network_diagram || {};
    const importantLabel = (guideData.common && guideData.common.important) ? guideData.common.important : 'Importante:';

    const svgs = {
        audio_modes: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#ffffff"></path>
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" stroke="#7B68EE"></path>
            <line x1="12" y1="18" x2="12" y2="23" stroke="#7B68EE"></line>
            <line x1="8" y1="23" x2="16" y2="23" stroke="#FF6B35"></line>
        </svg>`,
        users: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#7B68EE"></path>
            <circle cx="9" cy="7" r="4" stroke="#ffffff"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#FF6B35"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#FF6B35"></path>
        </svg>`,
        chat_transmission: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#7B68EE"></path>
            <path d="M8 10h8" stroke="#ffffff"></path>
            <path d="M8 6h8" stroke="#FF6B35"></path>
        </svg>`,
        audio_hardware: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="#ffffff"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" stroke="#7B68EE" fill="rgba(123,104,238,0.15)"></path>
            <circle cx="12" cy="12" r="2" fill="#FF6B35" stroke="#FF6B35"></circle>
        </svg>`,
        language_transcription: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 8l6 6" stroke="#7B68EE"></path>
            <path d="M4 14l6-6 2-3" stroke="#7B68EE"></path>
            <path d="M2 5h12" stroke="#ffffff"></path>
            <path d="M7 2h1" stroke="#ffffff"></path>
            <path d="M22 22l-5-10-5 10" stroke="#FF6B35"></path>
            <path d="M14 18h6" stroke="#FF6B35"></path>
        </svg>`,
        babel_translation: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="#7B68EE"></path>
            <path d="M2 12h20" stroke="#ffffff"></path>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#FF6B35"></path>
        </svg>`,
        messages_flow: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" stroke="#ffffff"></line>
            <line x1="8" y1="12" x2="21" y2="12" stroke="#7B68EE"></line>
            <line x1="8" y1="18" x2="21" y2="18" stroke="#FF6B35"></line>
            <line x1="3" y1="6" x2="3.01" y2="6" stroke="#ffffff" stroke-width="3"></line>
            <line x1="3" y1="12" x2="3.01" y2="12" stroke="#7B68EE" stroke-width="3"></line>
            <line x1="3" y1="18" x2="3.01" y2="18" stroke="#FF6B35" stroke-width="3"></line>
        </svg>`,
        hermes_tts: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke="#ffffff" fill="none"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="#FF6B35"></path>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#7B68EE"></path>
        </svg>`,
        visual_haptic_alerts: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#7B68EE"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#FF6B35"></path>
        </svg>`,
        triggers: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9z" stroke="#7B68EE" fill="none"></path>
            <path d="M12 5L6 13h7l-1 5 6-7H12z" stroke="#ffffff" stroke-width="1.5"></path>
            <circle cx="13" cy="11" r="2" fill="#FF6B35" stroke="#FF6B35"></circle>
        </svg>`,
        interface_customization: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.0331 19.1745 5.09903 19.4318 5.02324 19.6781L4.85507 20.2246C4.6644 20.8443 5.1764 21.4398 5.82397 21.3535L6.96911 21.2008C7.20235 21.1697 7.4384 21.2618 7.57945 21.4485C8.86872 21.8028 10.4075 22 12 22Z" stroke="#7B68EE"></path>
            <circle cx="7.5" cy="10.5" r="1.5" fill="#ffffff" stroke="#ffffff"></circle>
            <circle cx="11.5" cy="7.5" r="1.5" fill="#FF6B35" stroke="#FF6B35"></circle>
            <circle cx="16.5" cy="9.5" r="1.5" fill="#7B68EE" stroke="#7B68EE"></circle>
        </svg>`,
        network_best_practices: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" stroke="#ffffff"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" stroke="#7B68EE"></rect>
            <line x1="6" y1="10" x2="6" y2="14" stroke="#FF6B35"></line>
            <line x1="18" y1="10" x2="18" y2="14" stroke="#FF6B35"></line>
        </svg>`,
        data_sovereignty: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#7B68EE" fill="rgba(123,104,238,0.1)"></path>
            <rect x="9" y="11" width="6" height="5" rx="1" stroke="#ffffff"></rect>
            <path d="M10 11V9a2 2 0 1 1 4 0v2" stroke="#FF6B35"></path>
        </svg>`
    };

    cardsList.forEach((card) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'guide-card';
        cardEl.style.cssText = 'background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(123, 104, 238, 0.15); border-radius: 12px; padding: 18px; display: flex; gap: 16px; align-items: flex-start;';

        const iconBlock = document.createElement('div');
        iconBlock.style.cssText = 'flex-shrink: 0; background: rgba(0,0,0,0.25); padding: 10px; border-radius: 10px; display: flex; align-items: center; justify-content: center;';

        // Blindaje Murphy: Si la sección remota trae su propio SVG inline (card.icon_svg), usarlo.
        // Si no, buscar en la biblioteca local svgs[card.id] o usar el fallback genérico.
        if (card.icon_svg && typeof card.icon_svg === 'string' && card.icon_svg.trim().startsWith('<svg')) {
            iconBlock.innerHTML = card.icon_svg;
        } else {
            iconBlock.innerHTML = svgs[card.id] || `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" stroke="#7B68EE"></circle>
                <line x1="12" y1="16" x2="12" y2="12" stroke="#ffffff"></line>
                <line x1="12" y1="8" x2="12.01" y2="8" stroke="#FF6B35" stroke-width="2.5"></line>
            </svg>`;
        }
        cardEl.appendChild(iconBlock);

        const contentBlock = document.createElement('div');
        contentBlock.style.cssText = 'flex: 1;';

        const titleEl = document.createElement('h3');
        titleEl.style.cssText = 'margin: 0 0 12px 0; font-size: 1rem; color: #ffffff; font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;';
        titleEl.textContent = card.title;
        contentBlock.appendChild(titleEl);

        const listEl = document.createElement('ul');
        listEl.style.cssText = 'list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px;';

        card.items.forEach((item, itemIdx) => {
            const liEl = document.createElement('li');

            const strongEl = document.createElement('strong');
            strongEl.style.cssText = 'color: #7B68EE; display: block; margin-bottom: 4px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;';
            strongEl.textContent = item.title;
            liEl.appendChild(strongEl);

            const textSpan = document.createElement('span');
            textSpan.style.cssText = 'color: #a0a0a0; font-size: 0.82rem; line-height: 1.5;';
            textSpan.innerHTML = item.description;
            liEl.appendChild(textSpan);

            // Network best practices diagram injection
            if (card.id === 'network_best_practices' && itemIdx === 0) {
                const diagDiv = document.createElement('div');
                diagDiv.innerHTML = `<div class="network-diagram-container" style="width: 100%; background: rgba(0,0,0,0.25); border-radius: 8px; padding: 15px; box-sizing: border-box; border: 1px solid rgba(255,255,255,0.05); margin: 8px 0;">
                    <svg viewBox="0 0 940 440" width="100%" xmlns="http://www.w3.org/2000/svg" style="display: block; overflow: visible; height: auto;">
                        <defs>
                            <linearGradient id="gradMaster" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#FF6B35" />
                                <stop offset="100%" stop-color="#FF9E79" />
                            </linearGradient>
                            <linearGradient id="gradRouter" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#7B68EE" />
                                <stop offset="100%" stop-color="#B2A8FF" />
                            </linearGradient>
                            <linearGradient id="gradClients" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#4F5D75" />
                                <stop offset="100%" stop-color="#8D99AE" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.02)" stroke-width="1" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#grid)" rx="6" />

                        <path d="M 327 80 L 327 170" stroke="#7E7E8A" stroke-width="2" stroke-dasharray="4,4" />

                        <g transform="translate(255, -5)">
                            <path d="M 15 60 a 25 25 0 0 1 30 -25 a 35 35 0 0 1 65 5 a 25 25 0 0 1 20 40 l -115 0 a 20 20 0 0 1 0 -20 z" fill="rgba(110, 110, 122, 0.15)" stroke="#7E7E8A" stroke-width="2.5" filter="url(#glow)" />
                            <text x="72" y="58" fill="#ffffff" font-size="15" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle">${net.internet || 'INTERNET'}</text>
                            <text x="72" y="74" fill="#7E7E8A" font-size="12" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle">${net.optional || 'OPCIONAL'}</text>
                        </g>

                        <path d="M 140 190 L 310 190" stroke="#FF6B35" stroke-width="3" stroke-dasharray="0" />
                        <circle cx="225" cy="190" r="4" fill="#ffffff" filter="url(#glow)" />
                        <text x="225" y="174" fill="#7E7E8A" font-size="12" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle">${net.ethernet_cable || 'ETHERNET CABLE RJ45'}</text>

                        <path d="M 380 180 L 410 180 L 410 38 L 570 38" stroke="#7B68EE" stroke-width="2.5" fill="none" />
                        <text x="490" y="28" fill="#7B68EE" font-size="12" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle">${net.ethernet_red || 'Red Ethernet / Cable LAN'}</text>
                        
                        <path d="M 380 192 L 430 192 L 430 113 L 570 113" stroke="#7B68EE" stroke-width="2.5" fill="none" />
                        <text x="490" y="103" fill="#7B68EE" font-size="12" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle">${net.ethernet_red || 'Red Ethernet / Cable LAN'}</text>

                        <text x="470" y="245" fill="#7B68EE" font-size="14" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle" filter="url(#glow)">${net.wifi_label || 'WIFI / WLAN'}</text>

                        <path d="M 435 90 A 80 80 0 0 1 435 250" stroke="#7B68EE" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-dasharray="4,4" opacity="0.25" />
                        <path d="M 470 50 A 130 130 0 0 1 470 300" stroke="#7B68EE" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-dasharray="4,4" opacity="0.15" />

                        <path d="M 382 135 A 15 15 0 0 1 382 155" stroke="#7B68EE" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8" />
                        <path d="M 387 130 A 22 22 0 0 1 387 160" stroke="#7B68EE" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.6" />
                        <path d="M 392 125 A 29 29 0 0 1 392 165" stroke="#7B68EE" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.4" />

                        <path d="M 572 180 A 10 10 0 0 0 572 196" stroke="#7B68EE" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8" />
                        <path d="M 567 175 A 16 16 0 0 0 567 201" stroke="#7B68EE" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5" />
                        <path d="M 582 262 A 10 10 0 0 0 582 278" stroke="#7B68EE" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8" />
                        <path d="M 577 257 A 16 16 0 0 0 577 283" stroke="#7B68EE" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5" />
                        <path d="M 587 342 A 10 10 0 0 0 587 358" stroke="#7B68EE" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8" />
                        <path d="M 582 337 A 16 16 0 0 0 582 363" stroke="#7B68EE" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5" />

                        <path d="M 370 190 L 580 190" stroke="#7B68EE" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5" />
                        <path d="M 370 190 L 590 270" stroke="#7B68EE" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5" />
                        <path d="M 370 190 L 595 350" stroke="#7B68EE" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5" />

                        <g transform="translate(30, 120)">
                            <rect x="10" y="10" width="100" height="120" rx="8" fill="url(#gradMaster)" filter="url(#glow)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
                            <line x1="25" y1="35" x2="95" y2="35" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
                            <line x1="25" y1="55" x2="95" y2="55" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
                            <line x1="25" y1="75" x2="95" y2="75" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
                            <circle cx="85" cy="105" r="6" fill="#00ff88" filter="url(#glow)" />
                            <circle cx="65" cy="105" r="4" fill="#ffffff" opacity="0.8" />
                            <text x="60" y="154" fill="#ffffff" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold" text-anchor="middle">${net.master_server || 'SERVIDOR MASTER'}</text>
                            <text x="60" y="174" fill="#FF6B35" font-size="14" font-family="monospace" font-weight="bold" text-anchor="middle">192.168.1.150:3000</text>
                            <rect x="15" y="3" width="90" height="22" rx="4" fill="#111" stroke="#FF6B35" stroke-width="1.5" />
                            <text x="60" y="18" fill="#FF6B35" font-size="12" font-family="'Outfit', sans-serif" font-weight="bold" text-anchor="middle">★ ${net.licensed || 'LICENCIADO'}</text>
                        </g>

                        <g transform="translate(300, 140)">
                            <rect x="10" y="30" width="70" height="40" rx="6" fill="url(#gradRouter)" filter="url(#glow)" />
                            <rect x="74" y="36" width="6" height="8" rx="1" fill="#111" stroke="#7B68EE" stroke-width="1.5" />
                            <rect x="74" y="48" width="6" height="8" rx="1" fill="#111" stroke="#7B68EE" stroke-width="1.5" />
                            <line x1="25" y1="30" x2="15" y2="10" stroke="#7B68EE" stroke-width="3" stroke-linecap="round" />
                            <line x1="65" y1="30" x2="75" y2="10" stroke="#7B68EE" stroke-width="3" stroke-linecap="round" />
                            <circle cx="15" cy="10" r="2.5" fill="#ffffff" />
                            <circle cx="75" cy="10" r="2.5" fill="#ffffff" />
                            <circle cx="25" cy="50" r="2.5" fill="#00ff88" />
                            <circle cx="35" cy="50" r="2.5" fill="#00ff88" />
                            <circle cx="45" cy="50" r="2.5" fill="#00ff88" />
                            <circle cx="55" cy="50" r="2.5" fill="#ff6b35" />
                            <text x="45" y="94" fill="#B2A8FF" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold" text-anchor="middle">${net.router || 'ROUTER'}</text>
                        </g>

                        <g transform="translate(560, 20)">
                            <rect x="10" y="5" width="45" height="30" rx="4" fill="url(#gradClients)" stroke="#7B68EE" stroke-width="1.5" />
                            <path d="M 22 35 L 43 35 L 47 48 L 18 48 Z" fill="#8D99AE" />
                            <rect x="13" y="8" width="39" height="20" fill="#0c0c0e" />
                            <text x="32" y="21" fill="#00ff88" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">HTTPS</text>
                            <text x="70" y="24" fill="#ffffff" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold">${net.device1 || 'Dispositivo 1: PC Principal (Cable)'}</text>
                            <text x="70" y="43" fill="#FF6B35" font-size="13" font-family="monospace" font-weight="bold">${net.https_url || 'https://192.168.1.150:3000'}</text>
                        </g>

                        <g transform="translate(560, 95)">
                            <rect x="10" y="5" width="45" height="30" rx="4" fill="url(#gradClients)" stroke="#7B68EE" stroke-width="1.5" />
                            <path d="M 22 35 L 43 35 L 47 48 L 18 48 Z" fill="#8D99AE" />
                            <rect x="13" y="8" width="39" height="20" fill="#0c0c0e" />
                            <text x="32" y="21" fill="#00ff88" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">HTTPS</text>
                            <text x="70" y="24" fill="#ffffff" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold">${net.device2 || 'Dispositivo 2: PC Apoyo (Cable)'}</text>
                            <text x="70" y="43" fill="#FF6B35" font-size="13" font-family="monospace" font-weight="bold">${net.https_url || 'https://192.168.1.150:3000'}</text>
                        </g>

                        <g transform="translate(580, 175)">
                            <rect x="10" y="5" width="40" height="26" rx="3" fill="url(#gradClients)" stroke="#7B68EE" stroke-width="1.5" />
                            <rect x="13" y="8" width="34" height="20" fill="#0c0c0e" rx="1" />
                            <line x1="2" y1="31" x2="58" y2="31" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
                            <text x="30" y="21" fill="#00ff88" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">HTTPS</text>
                            <text x="70" y="20" fill="#ffffff" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold">${net.device3 || 'Dispositivo 3: Portátil (Wi-Fi)'}</text>
                            <text x="70" y="38" fill="#FF6B35" font-size="13" font-family="monospace" font-weight="bold">${net.https_url || 'https://192.168.1.150:3000'}</text>
                        </g>

                        <g transform="translate(590, 255)">
                            <rect x="10" y="5" width="28" height="38" rx="4" fill="url(#gradClients)" stroke="#ffffff" stroke-width="1.5" />
                            <rect x="13" y="8" width="22" height="26" fill="#0c0c0e" rx="1.5" />
                            <circle cx="24" cy="38" r="2" fill="#ffffff" />
                            <text x="24" y="24" fill="#00ff88" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">HTTPS</text>
                            <text x="60" y="22" fill="#ffffff" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold">${net.device4 || 'Dispositivo 4: Tablet (Wi-Fi)'}</text>
                            <text x="60" y="40" fill="#FF6B35" font-size="13" font-family="monospace" font-weight="bold">${net.https_url || 'https://192.168.1.150:3000'}</text>
                        </g>

                        <g transform="translate(595, 335)">
                            <rect x="10" y="5" width="20" height="34" rx="4" fill="url(#gradClients)" stroke="#ffffff" stroke-width="1.2" />
                            <rect x="12" y="7" width="16" height="24" fill="#0c0c0e" rx="1.5" />
                            <circle cx="20" cy="35" r="1.5" fill="#ffffff" />
                            <text x="20" y="21" fill="#00ff88" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">HTTPS</text>
                            <text x="55" y="20" fill="#ffffff" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold">${net.device5 || 'Dispositivo 5: Teléfono Móvil (Wi-Fi)'}</text>
                            <text x="55" y="38" fill="#FF6B35" font-size="13" font-family="monospace" font-weight="bold">${net.https_url || 'https://192.168.1.150:3000'}</text>
                        </g>
                    </svg>
                </div>`;
                liEl.appendChild(diagDiv);
            }

            if (item.subTitle) {
                const subTitleEl = document.createElement('p');
                subTitleEl.style.cssText = 'margin: 8px 0 4px 0; color: #a0a0a0; font-size: 0.82rem; font-weight: 600;';
                subTitleEl.textContent = item.subTitle;
                liEl.appendChild(subTitleEl);
            }

            if (item.subitems && item.subitems.length > 0) {
                const subUl = document.createElement('ul');
                subUl.style.cssText = 'margin: 4px 0 0 0; padding-left: 16px; color: #a0a0a0; font-size: 0.8rem; line-height: 1.5; list-style-type: square;';
                item.subitems.forEach(subItem => {
                    const subLi = document.createElement('li');
                    subLi.textContent = subItem;
                    subUl.appendChild(subLi);
                });
                liEl.appendChild(subUl);
            }

            if (item.compatible) {
                const compLabel = document.createElement('span');
                compLabel.style.cssText = 'display: block; margin: 8px 0 4px 0; font-size: 0.82rem; color: #7B68EE; font-weight: bold;';
                compLabel.textContent = item.compatible;
                liEl.appendChild(compLabel);
            }

            if (item.compatible_list && item.compatible_list.length > 0) {
                const compUl = document.createElement('ul');
                compUl.style.cssText = 'margin: 4px 0 0 0; padding-left: 16px; color: #a0a0a0; font-size: 0.8rem; line-height: 1.5; list-style-type: square;';
                item.compatible_list.forEach(compItem => {
                    const compLi = document.createElement('li');
                    compLi.textContent = compItem;
                    compUl.appendChild(compLi);
                });
                liEl.appendChild(compUl);
            }

            if (item.statuses) {
                const statusBlock = document.createElement('div');
                statusBlock.style.cssText = 'margin-top: 8px; display: flex; flex-direction: column; gap: 8px; padding-left: 12px; border-left: 2px solid rgba(255,255,255,0.05);';
                Object.keys(item.statuses).forEach(color => {
                    const row = document.createElement('div');
                    row.style.cssText = 'display: flex; align-items: center; gap: 8px;';

                    const dot = document.createElement('span');
                    dot.style.cssText = `width: 8px; height: 8px; border-radius: 50%; background: ${color === 'green' ? '#00ff88' : '#ff3b30'};`;
                    row.appendChild(dot);

                    const desc = document.createElement('span');
                    desc.style.cssText = 'color: #a0a0a0; font-size: 0.8rem;';
                    desc.textContent = item.statuses[color];
                    row.appendChild(desc);

                    statusBlock.appendChild(row);
                });
                liEl.appendChild(statusBlock);
            }

            if (item.examples) {
                const examplesDiv = document.createElement('div');
                examplesDiv.style.cssText = 'margin-top: 10px; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.03); border-radius: 6px; padding: 12px;';

                const label = document.createElement('span');
                label.style.cssText = 'color: #7B68EE; font-size: 0.8rem; font-weight: bold; display: block; margin-bottom: 8px;';
                label.textContent = item.examples.label;
                examplesDiv.appendChild(label);

                const table = document.createElement('table');
                table.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left; color: #a0a0a0;';

                item.examples.pairs.forEach(pair => {
                    const tr = document.createElement('tr');
                    tr.style.cssText = 'border-bottom: 1px solid rgba(255,255,255,0.03);';

                    const td1 = document.createElement('td');
                    td1.style.cssText = 'padding: 6px 4px; font-style: italic;';
                    td1.textContent = pair[0];

                    const tdArrow = document.createElement('td');
                    tdArrow.style.cssText = 'padding: 6px 4px; color: #FF6B35; width: 20px;';
                    tdArrow.textContent = '→';

                    const td2 = document.createElement('td');
                    td2.style.cssText = 'padding: 6px 4px; font-weight: bold; color: #ffffff;';
                    td2.textContent = pair[1];

                    tr.appendChild(td1);
                    tr.appendChild(tdArrow);
                    tr.appendChild(td2);
                    table.appendChild(tr);
                });
                examplesDiv.appendChild(table);
                liEl.appendChild(examplesDiv);
            }

            if (item.extra) {
                const extraEl = document.createElement('span');
                extraEl.style.cssText = 'color: #a0a0a0; font-size: 0.82rem; line-height: 1.5; display: block; margin-top: 6px;';
                extraEl.innerHTML = item.extra;
                liEl.appendChild(extraEl);
            }

            if (item.note) {
                const noteDiv = document.createElement('div');
                noteDiv.style.cssText = 'margin-top: 6px; padding: 8px; border-left: 2px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.02); border-radius: 0 6px 6px 0;';

                const noteText = document.createElement('span');
                noteText.style.cssText = 'color: #888888; font-size: 0.78rem; font-style: italic; display: block;';
                noteText.innerHTML = item.note;
                noteDiv.appendChild(noteText);

                liEl.appendChild(noteDiv);
            }

            if (item.important) {
                const importantDiv = document.createElement('div');
                importantDiv.style.cssText = 'margin-top: 10px; padding: 12px; border-left: 3px solid #FF6B35; background: rgba(255, 107, 53, 0.06); border-radius: 4px 8px 8px 4px;';

                const noteTitle = document.createElement('span');
                noteTitle.style.cssText = 'color: #FF6B35; font-size: 0.8rem; font-weight: bold; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;';
                noteTitle.textContent = importantLabel;
                importantDiv.appendChild(noteTitle);

                const noteText = document.createElement('span');
                noteText.style.cssText = 'color: #a0a0a0; font-size: 0.78rem; line-height: 1.4; display: block;';
                noteText.innerHTML = item.important;
                importantDiv.appendChild(noteText);

                liEl.appendChild(importantDiv);
            }

            listEl.appendChild(liEl);
        });

        contentBlock.appendChild(listEl);
        cardEl.appendChild(contentBlock);
        container.appendChild(cardEl);
    });

    // Contenedor de estado vacío cuando no hay coincidencias en la guía de pre-launch
    const emptyStateI18n = {
        es: 'No se encontraron resultados',
        en: 'No results found',
        eu: 'Ez da emaitzarik aurkitu',
        de: 'Keine Ergebnisse gefunden',
        ar: 'لم يتم العثور على نتائج',
        ca: 'No s\'han trobat resultats',
        zh: '未找到结果',
        ko: '결과를 찾을 수 없습니다',
        eo: 'Neniuj rezultoj trovitaj',
        fa: 'نتیجه‌ای یافت نشد',
        fr: 'Aucun résultat trouvé',
        gl: 'Non se atoparon resultados',
        nl: 'Geen resultaten gevonden',
        it: 'Nessun resultado trovato',
        ja: '結果が見つかりませんでした',
        kk: 'Нәтиже табылмады',
        pl: 'Nie znaleziono wyników',
        pt: 'Nenhum resultado encontrado',
        ru: 'Результаты не найдены',
        sv: 'Inga resultat hittades',
        tr: 'Sonuç bulunamadı',
        uk: 'Результатів не знайдено',
        uz: 'Hech qanday natija topilmadi',
        vi: 'Không tìm thấy kết quả'
    };

    const guideEmptyTitle = emptyStateI18n[lang] || emptyStateI18n['es'];
    const emptyState = document.createElement('div');
    emptyState.id = 'prelaunchGuideEmptyState';
    emptyState.style.cssText = 'display: none; text-align: center; padding: 40px 20px; color: var(--text-secondary, rgba(255,255,255,0.45)); font-size: 0.9rem;';
    emptyState.innerHTML = `
            <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.4; margin-bottom: 12px;">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <div style="font-weight: 600; color: var(--text-primary, #ffffff); margin-bottom: 4px;">${guideEmptyTitle}</div>
        `;
    container.appendChild(emptyState);
}

/**
 * 📜 Sistema Legal & Licencias Dinámico de Pre-Launch (24 Idiomas)
 * Patrón "Stale-While-Revalidate" con Blindaje Murphy Offline-First:
 * Nivel 1: Lectura inmediata (0ms) desde caché en localStorage o paquete local empaquetado.
 * Nivel 2: Verificación asíncrona en segundo plano hacia https://www.talk-me.app/locales/legal/{lang}.json (3.5s timeout).
 * Nivel 3: Validación de integridad JSON y actualización suave de interfaz sin parpadeos.
 */
async function loadPrelaunchLegal(lang) {
    const container = document.getElementById('prelaunchLegalContainer');
    if (!container) return;

    lang = (lang || 'es').toLowerCase();

    // ── NIVEL 1: Carga inmediata (0 ms) ──
    const cacheKey = `talkme_legal_cache_${lang}`;
    let cachedLegal = null;
    try {
        const rawCached = localStorage.getItem(cacheKey);
        if (rawCached) {
            const parsed = JSON.parse(rawCached);
            if (parsed && Array.isArray(parsed.ai_components)) {
                cachedLegal = parsed;
            }
        }
    } catch (e) { }

    // Si tenemos versión en caché, renderizarla de inmediato
    if (cachedLegal) {
        renderPrelaunchLegal(cachedLegal, container, lang);
    } else {
        container.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 0.9rem; text-align: center; padding: 20px;">Cargando información legal...</div>';
        try {
            const res = await fetch(`./locales/legal/${lang}.json`);
            if (!res.ok) throw new Error('Local legal not found');
            const legalData = await res.json();
            renderPrelaunchLegal(legalData, container, lang);
            try { localStorage.setItem(cacheKey, JSON.stringify(legalData)); } catch (e) { }
        } catch (err) {
            try {
                const resEs = await fetch(`./locales/legal/es.json`);
                const legalDataEs = await resEs.json();
                renderPrelaunchLegal(legalDataEs, container, 'es');
            } catch (fallbackErr) {
                container.innerHTML = '<div style="color: #ff6b35; font-size: 0.9rem; text-align: center; padding: 20px;">Error loading legal information.</div>';
            }
        }
    }

    // ── NIVEL 2: Sondeo en segundo plano (Silencioso, timeout 3.5s, con cache-busting) ──
    const remoteUrl = `https://www.talk-me.app/locales/legal/${lang}.json?_t=${Date.now()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    fetch(remoteUrl, { cache: 'no-store', signal: controller.signal })
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(remoteData => {
            clearTimeout(timeoutId);
            // ── NIVEL 3: Validación de integridad y actualización silenciosa ──
            if (remoteData && Array.isArray(remoteData.ai_components) && remoteData.ai_components.length > 0) {
                const remoteStr = JSON.stringify(remoteData);
                const currentStr = localStorage.getItem(cacheKey);
                if (remoteStr !== currentStr) {
                    try { localStorage.setItem(cacheKey, remoteStr); } catch (e) { }
                    if (container.dataset.renderedLang === lang) {
                        renderPrelaunchLegal(remoteData, container, lang);
                        console.log(`[Launchpad] Información Legal (${lang}) actualizada desde servidor.`);
                    }
                }
            }
        })
        .catch(err => {
            clearTimeout(timeoutId);
            // Murphy Mitigation: Silencio absoluto si estamos offline, modo avión o corte de red
        });
}

function renderPrelaunchLegal(legalData, container, lang) {
    container.innerHTML = '';
    container.dataset.renderedLang = lang;

    const i18n = legalData.i18n || {};
    const copyright = legalData.copyright || {};
    const aiList = legalData.ai_components || [];
    const npmList = legalData.npm_packages || [];
    const fullLicenses = legalData.full_licenses || [];

    // 1. Tarjeta de Copyright & Marca Registrada
    const copyCard = document.createElement('div');
    copyCard.className = 'legal-card legal-card-copyright';
    copyCard.dataset.legalSection = 'copyright';
    copyCard.style.cssText = 'border-radius: 14px; padding: 20px; margin-bottom: 16px; text-align: left;';
    copyCard.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: color-mix(in srgb, var(--accent-primary, #7B68EE) 20%, transparent); display: flex; align-items: center; justify-content: center; color: var(--accent-primary, #7B68EE);">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12ZM12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12C21.25 6.89137 17.1086 2.75 12 2.75Z" fill="currentColor"></path>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12.2857 8.75C10.2834 8.75 8.75 10.253 8.75 12C8.75 13.747 10.2834 15.25 12.2857 15.25C12.7974 15.25 13.281 15.1504 13.7168 14.9727C14.1003 14.8163 14.5381 15.0004 14.6945 15.384C14.8509 15.7675 14.6667 16.2052 14.2832 16.3616C13.669 16.6121 12.9931 16.75 12.2857 16.75C9.55414 16.75 7.25 14.6712 7.25 12C7.25 9.32875 9.55414 7.25 12.2857 7.25C12.9931 7.25 13.669 7.38791 14.2832 7.63836C14.6667 7.79477 14.8509 8.23249 14.6945 8.61604C14.5381 8.99958 14.1003 9.18372 13.7168 9.02731C13.281 8.84961 12.7974 8.75 12.2857 8.75Z" fill="currentColor"></path>
                </svg>
            </div>
            <div>
                <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-primary, #ffffff);">${copyright.title || 'Aviso de Copyright'}</h3>
                <span style="font-size: 0.8rem; color: var(--accent-primary, #7B68EE); font-family: monospace;">${copyright.holder || 'Jorge Gonzalez Dominguez / talk-me.app'}</span>
            </div>
        </div>
        <p style="font-size: 0.82rem; line-height: 1.55; color: var(--text-secondary, rgba(255, 255, 255, 0.75)); margin: 0 0 10px 0;">
            ${copyright.notice || ''}
        </p>
        <div style="font-size: 0.76rem; color: var(--text-secondary, rgba(255, 255, 255, 0.45)); border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)); padding-top: 10px;">
            ${i18n.notice_third_party || ''}
        </div>
    `;
    container.appendChild(copyCard);

    // 2. Sección Modelos de IA y Motores Nativos
    const aiHeader = document.createElement('h4');
    aiHeader.className = 'legal-section-header';
    aiHeader.dataset.legalHeader = 'ai';
    aiHeader.style.cssText = 'color: var(--accent-primary, #7B68EE) !important; font-size: 0.92rem; text-transform: uppercase; letter-spacing: 0.8px; margin: 18px 0 12px 0; text-align: left; font-weight: 700; display: flex; align-items: center; gap: 8px;';
    aiHeader.innerHTML = `
        <svg height="20" width="20" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
            <path stroke-width="28" d="M492.215,208.417c-1.225-1.243-2.539-2.424-3.87-3.586c0.696-3.88,1.1-7.831,1.1-11.844 c0.004-10.636-2.53-21.467-7.808-31.464c-6.033-11.462-14.969-20.554-25.401-26.715c-7.297-4.315-15.323-7.191-23.642-8.532 c-2.019-7.182-5.185-14.019-9.438-20.224c-7.08-10.334-17.148-18.892-29.467-24.193c-8.811-3.791-18.058-5.611-27.14-5.611 c0,0-0.28-0.009-0.79,0.036c-11.533,0.134-22.759,3.161-32.69,8.692c-3.884-4.679-8.376-8.843-13.375-12.35 c-10.956-7.697-24.353-12.261-38.687-12.403c-0.165-0.009-0.364-0.017-0.608-0.026c-0.031,0-0.062,0-0.097,0h-0.009h-0.009h-0.004 c-0.022,0-0.044,0-0.066,0c-0.133,0-0.293,0.009-0.497,0.017c-12.482,0.098-24.277,3.543-34.354,9.508 c-4.368,2.575-8.354,5.673-12.012,9.118c-10.44-6.508-22.777-10.308-35.917-10.37l-0.048-0.008h-0.311c-0.009,0-0.014,0-0.022,0 c-0.018,0-0.036,0-0.057,0c-0.16,0-0.36,0.008-0.613,0.026c-13.979,0.133-27.088,4.466-37.896,11.817 c-6.264,4.253-11.746,9.518-16.279,15.545c-5.735-1.553-11.723-2.396-17.841-2.396-5.091,0-10.254,0.577-15.394,1.749 c-15.138,3.471-28.068,11.772-37.334,22.861h0.005c-6.503,7.768-11.195,16.93-13.77,26.812 c-9.873,3.348-19.177,8.959-26.959,16.886c-0.004,0.009-0.013,0.018-0.022,0.027c-13.051,13.308-19.621,30.718-19.616,48.004v0.026 v0.036c0,0,0,0.017,0,0.035v0.186h0.004c0.017,6.01,0.83,12.003,2.415,17.827C4.799,239.81,0.005,254.272,0,269.073 c-0.004,10.955,2.638,22.097,8.128,32.369c6.17,11.533,15.244,20.668,25.8,26.856c7.404,4.341,15.532,7.21,23.952,8.559 c4.484,12.048,12.172,22.444,22.009,30.141c11.701,9.172,26.462,14.596,42.278,14.596c1.643,0,3.281-0.052,4.918-0.177h0.04h0.022 h0.005h0.004c6.982-0.506,13.672-2.077,19.904-4.501c4.142,6.64,9.348,12.508,15.395,17.348 c11.697,9.366,26.572,14.96,42.517,15.031c0.058,0.009,0.106,0.009,0.156,0.009c0.054,0,0.106,0,0.156,0h0.009 c0.005,0,0.005,0,0.005,0h0.013h0.071c0.023,0,0.032,0,0.054,0l0.173-0.009h0.049c1.274-0.009,2.553-0.062,3.826-0.142h0.018 l0.75-0.018c5.708-0.418,11.222-1.528,16.447-3.249c6.583,9.775,15.75,18.022,27.092,23.492h-0.005 c9.57,4.616,19.78,6.827,29.8,6.827c9.756,0,19.3-2.121,28.054-6.046c12.722,13.512,30.661,21.627,49.957,21.646 c4.231,0,8.51-0.391,12.79-1.199c16.438-3.089,30.523-11.888,40.378-23.9h-0.004c6.436-7.821,11.067-17.054,13.544-27.016 c11.368-1.118,22.648-5.078,32.618-12.092c9.487-6.659,16.838-15.36,21.765-25.072c4.928-9.704,7.467-20.412,7.467-31.216 c0-7.2-1.172-14.428-3.476-21.397c5.917-4.82,11.15-10.698,15.323-17.578c6.748-11.098,9.997-23.474,9.997-35.638 C511.996,238.914,505.102,221.468,492.215,208.417z"></path>
            <path stroke-width="18" d="M345.934,233.32c-3.329-1.882-7.555-0.71-9.438,2.619c-1.882,3.329-0.71,7.565,2.624,9.447 c5.114,2.912,8.235,6.161,10.298,9.518c-8.54,3-16.11,4.234-22.799,4.234c-9.789-0.009-17.796-2.593-24.548-6.552 c-6.734-3.968-12.18-9.393-16.309-15.022c-6.806-9.278-15.661-17.542-26.098-23.571c-10.422-6.011-22.479-9.767-35.419-9.767 c-11.347-0.008-23.305,2.913-35.153,9.42c-4.844,2.655-9.043,5.762-12.7,9.153c-14.414,5.549-26.834,7.546-37.341,7.546 c-14.969,0-26.151-4.022-33.627-7.973c-3.733-1.971-6.525-3.933-8.332-5.353c-0.906-0.719-1.566-1.288-1.976-1.66l-0.426-0.409 l-0.067-0.062H94.62c-2.655-2.726-7.023-2.796-9.771-0.151c-2.752,2.654-2.832,7.04-0.177,9.792 c0.386,0.391,5.149,5.265,14.267,10.095c3.991,2.113,8.883,4.19,14.534,5.886c-1.501,2.113-3.551,5.202-5.784,9.135 c-4.293,7.573-9.225,18.201-11.738,30.737c-0.75,3.746,1.683,7.396,5.434,8.15c3.751,0.745,7.404-1.688,8.15-5.442 c2.108-10.556,6.414-19.94,10.205-26.608c1.891-3.338,3.645-5.993,4.906-7.778c0.63-0.896,1.136-1.58,1.474-2.024 c0.168-0.214,0.297-0.382,0.373-0.48l0.08-0.098l0.009-0.009l0.004-0.009c0.639-0.781,1.066-1.66,1.309-2.583 c3.525,0.434,7.227,0.701,11.156,0.692c7.284,0.009,15.261-0.852,23.851-2.805c-4.258,9.18-6.01,18.76-6.015,27.54 c0.017,8.843,1.7,16.869,4.701,23.261c1.637,3.463,5.77,4.936,9.228,3.303c3.458-1.634,4.936-5.771,3.298-9.224v-0.009 c-1.926-4.013-3.392-10.334-3.369-17.331c-0.005-7.546,1.624-15.856,5.531-23.438c3.928-7.582,10.028-14.498,19.479-19.701 c9.974-5.46,19.496-7.698,28.49-7.706c10.24,0,19.887,2.957,28.498,7.91c8.603,4.963,16.119,11.95,21.844,19.762 c5.038,6.872,11.778,13.655,20.452,18.769c8.656,5.114,19.284,8.478,31.58,8.469c8.136,0,16.975-1.474,26.466-4.706l0.022,0.497 c0,3.392-0.528,6.481-1.056,8.665c-0.262,1.092-0.524,1.954-0.706,2.513c-0.093,0.275-0.164,0.479-0.208,0.594l-0.04,0.107 l-0.004,0.017h0.004c-1.403,3.543,0.324,7.556,3.866,8.976c3.551,1.421,7.586-0.311,9.007-3.862 c0.177-0.497,2.966-7.413,2.992-17.011c0-5.505-0.964-11.968-4.164-18.35C359.62,244.054,354.133,237.928,345.934,233.32z"></path>
            <path stroke-width="18" d="M361.382,187.056c-19.043,0-34.336-7.014-44.914-16.194c-5.278-4.581-9.336-9.704-12.003-14.604 c-2.681-4.91-3.911-9.58-3.893-13.078c0-3.827-3.103-6.925-6.929-6.925c-3.826,0-6.926,3.098-6.926,6.925 c0.018,6.516,2.055,13.193,5.58,19.692c3.689,6.766,9.078,13.335,15.928,19.123c-1.381,1.918-3.286,4.387-5.718,7.032 c-5.278,5.762-12.886,12.145-21.969,15.368c-3.604,1.287-5.482,5.256-4.194,8.851c1.287,3.605,5.252,5.488,8.852,4.199 c12.327-4.43,21.555-12.508,27.815-19.381c2.788-3.072,4.958-5.877,6.561-8.123c11.462,6.614,25.618,10.982,41.812,10.973 c3.822,0,6.93-3.098,6.93-6.925C368.311,190.164,365.204,187.056,361.382,187.056z"></path>
            <path stroke-width="18" d="M315.197,322.537c-12.961,0-23.26-2.504-31.535-6.33c-12.385-5.753-20.42-14.595-25.476-23.412 c-2.521-4.395-4.261-8.771-5.358-12.616c-1.101-3.826-1.532-7.182-1.523-9.215c0-3.826-3.098-6.926-6.925-6.926 c-3.831,0-6.929,3.099-6.929,6.926c0,2.495,0.297,5.256,0.906,8.292c1.056,5.291,3.067,11.409,6.326,17.712 c4.888,9.447,12.647,19.354,24.242,26.884c2.903,1.899,6.046,3.622,9.428,5.166c0.528,2.273,1.261,6.321,1.256,11.204 c0,3.552-0.382,7.511-1.456,11.569c-1.074,4.057-2.823,8.195-5.602,12.216c-2.179,3.152-1.394,7.466,1.754,9.642 c3.148,2.175,7.462,1.394,9.638-1.749c3.782-5.469,6.178-11.151,7.608-16.567c1.434-5.424,1.913-10.582,1.913-15.111 c0-2.264-0.124-4.359-0.311-6.276c6.677,1.554,13.992,2.459,22.044,2.45c3.823,0,6.926-3.107,6.926-6.934 C322.123,325.644,319.02,322.537,315.197,322.537z"></path>
            <path stroke-width="18" d="M409.302,218.468c-3.431-2.956-7.133-5.38-11.04-7.103c-3.902-1.722-8.026-2.752-12.248-2.752 c-3.826,0-6.929,3.098-6.929,6.925c0,3.836,3.103,6.934,6.929,6.934c2.548-0.009,5.771,0.879,9.158,2.841 c5.078,2.912,10.357,8.141,14.196,14.693c3.862,6.543,6.308,14.33,6.304,22.373c-0.031,8.852-2.819,18.085-10.365,27.266 c-2.437,2.956-2.02,7.315,0.932,9.756c2.948,2.433,7.316,2.016,9.753-0.932c9.508-11.472,13.565-24.194,13.534-36.09 c0-7.227-1.447-14.142-3.879-20.446C421.988,232.485,416.16,224.398,409.302,218.468z"></path>
            <path stroke-width="18" d="M168.073,181.534v-0.009c4.759-5.638,11.538-10.059,19.266-13.033c7.715-2.983,16.327-4.475,24.384-4.466 c7.848-0.018,15.155,1.429,20.514,3.924c3.476,1.598,7.59,0.089,9.198-3.391c1.602-3.472,0.084-7.582-3.387-9.19 c-7.741-3.56-16.837-5.194-26.324-5.202c-9.739,0-19.901,1.758-29.365,5.388c-9.441,3.64-18.235,9.199-24.862,17.02 c-2.473,2.921-2.109,7.297,0.812,9.766C161.228,184.819,165.601,184.446,168.073,181.534z"></path>
        </svg>
        <span>${i18n.tab_ai || 'Modelos IA y Binarios'}</span>
    `;
    container.appendChild(aiHeader);

    aiList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'legal-card';
        card.dataset.legalSection = 'ai';
        card.style.cssText = 'border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; text-align: left; display: flex; flex-direction: column; gap: 6px;';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <div>
                    <strong style="color: var(--text-primary, #ffffff); font-size: 0.92rem;">${item.name}</strong>
                    <span style="display: block; font-size: 0.76rem; color: var(--accent-primary, #7B68EE); margin-top: 2px;">${item.category}</span>
                </div>
                <span class="legal-badge-pill" style="background: color-mix(in srgb, var(--accent-primary, #7B68EE) 15%, transparent); color: var(--accent-primary, #7B68EE); font-size: 0.74rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid color-mix(in srgb, var(--accent-primary, #7B68EE) 30%, transparent); font-family: monospace;">${item.license}</span>
            </div>
            <p style="font-size: 0.8rem; line-height: 1.45; color: var(--text-secondary, rgba(255, 255, 255, 0.7)); margin: 4px 0;">${item.description || ''}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.76rem; color: var(--text-secondary, rgba(255, 255, 255, 0.45)); margin-top: 4px; border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.04)); padding-top: 6px;">
                <span><strong>${i18n.label_author || 'Autor / Organización:'}</strong> ${item.author}</span>
                <span><strong>${i18n.label_source || 'Código / Origen:'}</strong> <a href="${item.source}" target="_blank" style="color: var(--accent-primary, #7B68EE); text-decoration: none;">${item.source}</a></span>
            </div>
        `;
        container.appendChild(card);
    });

    // 3. Sección Paquetes NPM / Node.js
    const npmHeader = document.createElement('h4');
    npmHeader.className = 'legal-section-header';
    npmHeader.dataset.legalHeader = 'npm';
    npmHeader.style.cssText = 'color: var(--accent-primary, #7B68EE) !important; font-size: 0.92rem; text-transform: uppercase; letter-spacing: 0.8px; margin: 24px 0 12px 0; text-align: left; font-weight: 700; display: flex; align-items: center; gap: 8px;';
    npmHeader.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
            <path d="M10 13H14M19 9V20H5V9M19 9H5M19 9C19.5523 9 20 8.55228 20 8V5C20 4.44772 19.5523 4 19 4H5C4.44772 4 4 4.44772 4 5V8C4 8.55228 4.44772 9 5 9"></path>
        </svg>
        <span>${i18n.tab_npm || 'Paquetes Open Source'}</span>
    `;
    container.appendChild(npmHeader);

    const npmGrid = document.createElement('div');
    npmGrid.dataset.legalGroup = 'npm';
    npmGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; margin-bottom: 20px;';

    npmList.forEach(pkg => {
        const pkgCard = document.createElement('div');
        pkgCard.className = 'legal-card';
        pkgCard.dataset.legalSection = 'npm';
        pkgCard.style.cssText = 'border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; text-align: left;';
        pkgCard.innerHTML = `
            <div>
                <strong style="color: var(--text-primary, #e2e8f0); font-size: 0.86rem; font-family: monospace;">${pkg.name}</strong>
                <span style="font-size: 0.75rem; color: var(--text-secondary, rgba(255, 255, 255, 0.4)); margin-left: 6px;">v${pkg.version}</span>
            </div>
            <span class="legal-badge-pill" style="background: color-mix(in srgb, var(--accent-primary, #7B68EE) 12%, transparent); color: var(--accent-primary, #7B68EE); font-size: 0.72rem; font-weight: 600; padding: 2px 7px; border-radius: 5px; font-family: monospace; border: 1px solid color-mix(in srgb, var(--accent-primary, #7B68EE) 20%, transparent);">${pkg.license}</span>
        `;
        npmGrid.appendChild(pkgCard);
    });
    container.appendChild(npmGrid);

    // 4. Sección Textos Completos de Licencias (Totalmente desplegadas y sin scroll interno)
    const licenseHeader = document.createElement('h4');
    licenseHeader.className = 'legal-section-header';
    licenseHeader.dataset.legalHeader = 'licenses';
    licenseHeader.style.cssText = 'color: var(--accent-primary, #7B68EE) !important; font-size: 0.92rem; text-transform: uppercase; letter-spacing: 0.8px; margin: 24px 0 12px 0; text-align: left; font-weight: 700; display: flex; align-items: center; gap: 8px;';
    licenseHeader.innerHTML = `
        <svg viewBox="-2 0 19 19" width="18" height="18" fill="currentColor" style="flex-shrink:0;">
            <path d="M14.443 4.445a1.615 1.615 0 0 1-1.613 1.614h-.506v8.396a1.615 1.615 0 0 1-1.613 1.613H2.17a1.613 1.613 0 1 1 0-3.227h.505V4.445A1.615 1.615 0 0 1 4.289 2.83h8.54a1.615 1.615 0 0 1 1.614 1.614zM2.17 14.96h7.007a1.612 1.612 0 0 1 0-1.01H2.172a.505.505 0 0 0 0 1.01zm9.045-10.515a1.62 1.62 0 0 1 .08-.505H4.29a.5.5 0 0 0-.31.107l-.002.001a.5.5 0 0 0-.193.397v8.396h6.337a.61.61 0 0 1 .6.467.632.632 0 0 1-.251.702.505.505 0 1 0 .746.445zm-.86 1.438h-5.76V6.99h5.76zm0 2.26h-5.76V9.25h5.76zm0 2.26h-5.76v1.108h5.76zm2.979-5.958a.506.506 0 0 0-.505-.505.496.496 0 0 0-.31.107h-.002a.501.501 0 0 0-.194.398v.505h.506a.506.506 0 0 0 .505-.505z"></path>
        </svg>
        <span>${i18n.tab_licenses || 'Textos de Licencias'}</span>
    `;
    container.appendChild(licenseHeader);

    fullLicenses.forEach(lic => {
        const licCard = document.createElement('div');
        licCard.className = 'legal-card';
        licCard.dataset.legalSection = 'licenses';
        licCard.style.cssText = 'border-radius: 12px; padding: 16px 18px; margin-bottom: 16px; text-align: left;';
        licCard.innerHTML = `
            <div style="font-weight: 700; color: var(--text-primary, #ffffff); font-size: 0.92rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));">
                <span>${lic.name}</span>
                <span class="legal-badge-pill" style="background: color-mix(in srgb, var(--accent-primary, #7B68EE) 15%, transparent); color: var(--accent-primary, #7B68EE); font-size: 0.74rem; font-weight: 600; padding: 3px 8px; border-radius: 5px; font-family: monospace; border: 1px solid color-mix(in srgb, var(--accent-primary, #7B68EE) 25%, transparent);">${lic.badge || 'LICENSE'}</span>
            </div>
            <pre class="legal-license-pre">${lic.text}</pre>
        `;
        container.appendChild(licCard);
    });

    // Contenedor de estado vacío cuando no hay coincidencias (24 idiomas)
    const legalEmptyI18n = {
        es: 'No se encontraron resultados',
        en: 'No results found',
        eu: 'Ez da emaitzarik aurkitu',
        de: 'Keine Ergebnisse gefunden',
        ar: 'لم يتم العثور على نتائج',
        ca: 'No s\'han trobat resultats',
        zh: '未找到结果',
        ko: '결과를 찾을 수 없습니다',
        eo: 'Neniuj rezultoj trovitaj',
        fa: 'نتیجه‌ای یافت نشد',
        fr: 'Aucun résultat trouvé',
        gl: 'Non se atoparon resultados',
        nl: 'Geen resultaten gevonden',
        it: 'Nessun risultato trovato',
        ja: '結果が見つかりませんでした',
        kk: 'Нәтиже табылмады',
        pl: 'Nie znaleziono wyników',
        pt: 'Nenhum resultado encontrado',
        ru: 'Результаты не найдены',
        sv: 'Inga resultat hittades',
        tr: 'Sonuç bulunamadı',
        uk: 'Результатів не знайдено',
        uz: 'Hech qanday natija topilmadi',
        vi: 'Không tìm thấy kết quả'
    };
    const legalEmptyTitle = legalEmptyI18n[lang] || legalEmptyI18n['es'];

    const emptyState = document.createElement('div');
    emptyState.id = 'prelaunchLegalEmptyState';
    emptyState.style.cssText = 'display: none; text-align: center; padding: 40px 20px; color: var(--text-secondary, rgba(255,255,255,0.45)); font-size: 0.9rem;';
    emptyState.innerHTML = `
        <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.4; margin-bottom: 12px;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <div style="font-weight: 600; color: var(--text-primary, #ffffff); margin-bottom: 4px;">${legalEmptyTitle}</div>
    `;
    container.appendChild(emptyState);
}


// ═══════════════════════════════════════════════════════════════
// GESTIÓN ROBUSTA DE DESCARGA DEL MOTOR DE TRADUCCIÓN (MADLAD-400)
// ═══════════════════════════════════════════════════════════════
let _translatePostponedThisSession = false;
let _translateDownloadPollInterval = null;
let _isPollingTranslate = false;
let _isUpdatingTranslateTab = false;
let _lastTranslateProgressPct = 0;
let _translateUserInitiatedDownload = false;

function isTranslationEnabled() {
    return localStorage.getItem('talkme_translate_enabled') !== 'false';
}

// Descarga transparente en segundo plano (arranque desatendido sin login previo)
async function startBackgroundTranslateDownload() {
    // Si el usuario ha deshabilitado la traducción, NO descargar en segundo plano
    if (!isTranslationEnabled() || _translatePostponedThisSession) return;
    try {
        const customPath = getEffectiveModelsPath();
        const chkRes = await fetch(`/api/check-models?customPath=${encodeURIComponent(customPath)}`);
        const chkData = await chkRes.json();
        if (chkData && chkData.success && chkData.models && chkData.models['translate']) {
            // Ya está descargado e instalado (>2.6 GB)
            return;
        }

        // Comprobar si ya se está descargando
        const progRes = await fetch('/api/download-progress');
        const progData = await progRes.json();
        if (progData && progData.downloads && progData.downloads['translate']) {
            const dl = progData.downloads['translate'];
            if (dl.status === 'downloading' || dl.status === 'unzipping' || dl.status === 'completed') {
                return;
            }
        }

        // Iniciar descarga silenciosa en segundo plano
        fetch('/api/download-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'translate', customPath })
        }).catch(err => {
            console.warn("⚠️ [SILENT-TRANSLATE-DOWNLOAD] Falló inicio en segundo plano:", err.message);
        });
    } catch (e) {
        console.warn("⚠️ [SILENT-TRANSLATE-DOWNLOAD] Error:", e.message);
    }
}

async function checkAndPromptTranslateDownload() {
    if (_translatePostponedThisSession) return;
    try {
        const customPath = getEffectiveModelsPath();
        const url = `/api/check-models?customPath=${encodeURIComponent(customPath)}`;
        const res = await fetch(url);
        const data = await res.json();

        // Si la traducción está desactivada voluntariamente por el usuario (en Mac o Windows),
        // respetamos su decisión y NUNCA volvemos a mostrar la advertencia
        if (!isTranslationEnabled()) return;

        // 1. Si hay una descarga activa en progreso, conectar la modal en modo 'progress'
        const progRes = await fetch('/api/download-progress');
        const progData = await progRes.json();
        if (progData && progData.downloads && progData.downloads['translate']) {
            const dlStatus = progData.downloads['translate'].status;
            if (dlStatus === 'downloading' || dlStatus === 'unzipping') {
                showDownloadTranslateModal('progress');
                return;
            }
        }

        // 2. Si no está descargado/instalado en disco, advertir con la modal (igual que en Windows)
        // El usuario puede iniciar la descarga o hacer clic en "Desactivar" para no volver a ver la advertencia.
        if (data && data.success && data.models) {
            if (!data.models['translate']) {
                showDownloadTranslateModal('decision');
            }
        }
    } catch (e) {
        console.warn("⚠️ No se pudo comprobar el estado del motor de traducción:", e.message);
    }
}

function showDownloadTranslateModal(mode = 'decision') {
    if (!isTranslationEnabled() || _translatePostponedThisSession) return;
    const modal = document.getElementById('downloadTranslateModal');
    if (!modal) return;

    // Sincronizar ruta en el input de la modal
    const currentPath = getEffectiveModelsPath();
    const inpModal = document.getElementById('inputModelsPathModal');
    if (inpModal) inpModal.value = currentPath;

    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.transform = 'scale(1)';

    // Si la sesión está activa, asegurar que el botón de ajustes (llave) permanezca visible
    const sessionActive = localStorage.getItem('talkme_session_active') === 'true';
    const btnKeySettings = document.getElementById('btnOpenPrelaunchSettings');
    if (btnKeySettings) {
        if (sessionActive) {
            btnKeySettings.style.setProperty('display', 'flex', 'important');
            btnKeySettings.style.setProperty('opacity', '1', 'important');
            btnKeySettings.style.setProperty('pointer-events', 'auto', 'important');
        } else {
            btnKeySettings.style.setProperty('display', 'none', 'important');
        }
    }

    const pathSelector = document.getElementById('translateModelsPathSelector');
    const actionsRow = document.getElementById('actionsRow');
    const btnStart = document.getElementById('btnStartDownload');
    const btnDisable = document.getElementById('btnPostpone');
    const postponeNotice = document.getElementById('postponeNotice');
    const progressWrapper = document.getElementById('progressWrapper');
    const badgeSuccess = document.getElementById('badgeSuccess');
    const footerLockStatus = document.getElementById('footerLockStatus');

    if (badgeSuccess) badgeSuccess.style.display = 'none';

    // Etiqueta oficial "Desactivar"
    const disableLabel = (translations[currentLang] && (translations[currentLang].btn_disable_translate || translations[currentLang].btn_disable)) || 'Desactivar';

    if (mode === 'progress') {
        if (pathSelector) {
            pathSelector.style.display = 'block';
            const btnSel = pathSelector.querySelector('button');
            if (btnSel) {
                btnSel.style.display = 'none';
            }
        }
        if (postponeNotice) postponeNotice.style.display = 'none';
        if (progressWrapper) progressWrapper.style.display = 'block';
        if (footerLockStatus) footerLockStatus.style.display = 'flex';
        if (actionsRow) {
            actionsRow.style.display = 'flex';
            actionsRow.style.width = '100%';
        }
        if (btnStart) btnStart.style.display = 'none';
        if (btnDisable) {
            btnDisable.style.display = 'block';
            btnDisable.style.width = '100%';
            btnDisable.innerText = disableLabel;
        }

        // Activación inmediata y robusta del polling de progreso
        pollTranslateDownloadProgress();
        if (_translateDownloadPollInterval) clearInterval(_translateDownloadPollInterval);
        _translateDownloadPollInterval = setInterval(pollTranslateDownloadProgress, 600);
    } else {
        // Modo 'decision': Si ya hay descarga corriendo en background, pasar a progress
        fetch('/api/download-progress').then(r => r.json()).then(data => {
            if (data && data.downloads && data.downloads['translate']) {
                const dl = data.downloads['translate'];
                if (dl.status === 'downloading' || dl.status === 'unzipping') {
                    showDownloadTranslateModal('progress');
                    return;
                }
            }
        }).catch(() => { });

        if (pathSelector) {
            pathSelector.style.display = 'block';
            const btnSel = pathSelector.querySelector('button');
            if (btnSel) {
                btnSel.style.display = 'inline-flex';
                btnSel.disabled = false;
            }
        }
        if (postponeNotice) postponeNotice.style.display = 'flex';
        if (progressWrapper) progressWrapper.style.display = 'none';
        if (footerLockStatus) footerLockStatus.style.display = 'none';
        if (actionsRow) {
            actionsRow.style.display = 'flex';
            actionsRow.style.width = '100%';
        }
        if (btnStart) btnStart.style.display = 'inline-flex';
        if (btnDisable) {
            btnDisable.style.display = 'inline-block';
            btnDisable.style.width = '';
            btnDisable.innerText = disableLabel;
        }
    }
}

function handleDisableTranslate() {
    _translatePostponedThisSession = true;
    localStorage.setItem('talkme_translate_enabled', 'false');

    // Sincronizar el interruptor en la pestaña de ajustes si está presente
    const btnToggle = document.getElementById('btnTogglePrelaunchTranslate');
    const chk = document.getElementById('chkPrelaunchTranslate');
    if (chk) chk.checked = false;
    if (btnToggle) {
        btnToggle.className = 'trigger-toggle tgl-off';
        btnToggle.innerText = 'OFF';
    }

    const modal = document.getElementById('downloadTranslateModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.opacity = '0';
    }

    if (_translateDownloadPollInterval) {
        clearInterval(_translateDownloadPollInterval);
        _translateDownloadPollInterval = null;
    }

    // Cancelar la descarga en segundo plano para liberar archivo y recursos de red
    fetch('/api/cancel-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'translate' })
    }).catch(() => { });

    // Restaurar botón de ajustes (llave) y contenedor de cabecera incondicionalmente en Pre-Launch
    const headerActions = document.getElementById('globalLangSwitcher');
    if (headerActions) {
        headerActions.style.setProperty('display', 'flex', 'important');
        headerActions.style.setProperty('opacity', '1', 'important');
        headerActions.style.setProperty('pointer-events', 'auto', 'important');
    }
    const btnKeySettings = document.getElementById('btnOpenPrelaunchSettings');
    if (btnKeySettings) {
        btnKeySettings.style.setProperty('display', 'flex', 'important');
        btnKeySettings.style.setProperty('opacity', '1', 'important');
        btnKeySettings.style.setProperty('pointer-events', 'auto', 'important');
    }
}

// Mantener compatibilidad si se llamase el nombre antiguo
function handlePostponeTranslate() {
    handleDisableTranslate();
}

function togglePrelaunchTranslateState() {
    const isCurrentlyEnabled = isTranslationEnabled();
    const btnToggle = document.getElementById('btnTogglePrelaunchTranslate');
    const chk = document.getElementById('chkPrelaunchTranslate');

    if (isCurrentlyEnabled) {
        // Desactivar traducción
        localStorage.setItem('talkme_translate_enabled', 'false');
        if (chk) chk.checked = false;
        if (btnToggle) {
            btnToggle.className = 'trigger-toggle tgl-off';
            btnToggle.innerText = 'OFF';
        }
        // Si hay una descarga activa en curso, cancelarla de inmediato
        fetch('/api/cancel-download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'translate' })
        }).catch(() => { });
        if (_translateDownloadPollInterval) {
            clearInterval(_translateDownloadPollInterval);
            _translateDownloadPollInterval = null;
        }
        updatePrelaunchTranslateTab();
    } else {
        // El usuario quiere activar traducción:
        // Verificar primero si el modelo ya está físicamente en disco (>2.6 GB)
        const customPath = getEffectiveModelsPath();
        fetch(`/api/check-models?customPath=${encodeURIComponent(customPath)}`)
            .then(r => r.json())
            .then(chkData => {
                const isInstalled = !!(chkData && chkData.success && chkData.models && chkData.models['translate']);
                if (isInstalled) {
                    // Ya está instalado y verificado: activar directamente a ON
                    localStorage.setItem('talkme_translate_enabled', 'true');
                    _translatePostponedThisSession = false;
                    if (chk) chk.checked = true;
                    if (btnToggle) {
                        btnToggle.className = 'trigger-toggle tgl-on';
                        btnToggle.innerText = 'ON';
                    }
                    updatePrelaunchTranslateTab();
                } else {
                    // NO está descargado: el botón se mantiene en OFF, se lanza la descarga y sólo se pondrá en ON al terminar y verificar
                    localStorage.setItem('talkme_translate_enabled', 'false');
                    if (chk) chk.checked = false;
                    if (btnToggle) {
                        btnToggle.className = 'trigger-toggle tgl-off';
                        btnToggle.innerText = 'OFF';
                    }
                    handleTranslateInstall();
                }
            })
            .catch(() => {
                // Fallback de red: intentar lanzar instalación manteniendo OFF
                handleTranslateInstall();
            });
    }
}

async function updatePrelaunchTranslateTab() {
    if (_isUpdatingTranslateTab) return;
    _isUpdatingTranslateTab = true;

    try {
        const cachedPath = getEffectiveModelsPath();
        const inpTrans = document.getElementById('inputTranslateModelsPath');
        if (inpTrans) inpTrans.value = cachedPath;

        const btnToggle = document.getElementById('btnTogglePrelaunchTranslate');
        const chk = document.getElementById('chkPrelaunchTranslate');

        // Textos multilingüe según el idioma actual
        const t = translations[currentLang] || translations['en'] || {};
        const toInstallTxt = t.btn_download || 'Instalar';
        const installedTxt = t.installed || 'Instalado';
        const deleteTxt = t.btn_delete || 'Borrar';
        const cancelTxt = t.btn_cancel || 'Cancelar';
        const crossSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="engine-cross-svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

        const actionArea = document.getElementById('engine-translate-action-area');
        const progressBox = document.getElementById('engine-translate-progress-box');

        const progRes = await fetch('/api/download-progress');
        const progData = await progRes.json();
        const dl = progData && progData.downloads && progData.downloads['translate'];

        // Caso 1: Descarga o extracción en curso
        if (dl && (dl.status === 'downloading' || dl.status === 'unzipping')) {
            if (chk) chk.checked = false;
            if (btnToggle) {
                btnToggle.className = 'trigger-toggle tgl-off';
                btnToggle.innerText = 'OFF';
            }

            if (progressBox) progressBox.style.display = 'block';
            const speedEl = document.getElementById('engine-translate-speed');
            const bytesEl = document.getElementById('engine-translate-bytes');
            const barEl = document.getElementById('engine-translate-progress-bar');
            if (speedEl) speedEl.innerText = dl.speed || '0 MB/s';
            if (bytesEl) bytesEl.innerText = `${dl.downloaded || '0 MB'} / ${dl.total || '2.75 GB'}`;

            // Monotonismo estricto: la barra jamás retrocede en la misma sesión de descarga
            const rawPct = dl.status === 'unzipping' ? 99 : (dl.progress || 0);
            _lastTranslateProgressPct = Math.max(_lastTranslateProgressPct, rawPct);
            if (barEl) barEl.style.width = `${_lastTranslateProgressPct}%`;

            if (actionArea) {
                actionArea.innerHTML = `
                    <button class="btn-engine-status downloading" id="btn-translate-action" onclick="handleTranslateCancel()">
                        <span class="status-text" style="display: flex; align-items: center; justify-content: center;">${crossSvg}${cancelTxt}</span>
                    </button>
                `;
            }
            return;
        }

        // Caso 2: Descarga no activa o recién finalizada
        if (progressBox) {
            progressBox.style.display = 'none';
        }

        // Comprobación física del modelo en disco (>2.6 GB)
        const chkRes = await fetch(`/api/check-models?customPath=${encodeURIComponent(cachedPath)}`);
        const chkData = await chkRes.json();
        const isInstalled = !!(chkData && chkData.success && chkData.models && chkData.models['translate']);
        const isCompletedNow = dl && dl.status === 'completed';

        // Auto-activación a ON si acaba de completarse satisfactoriamente o el usuario inició la descarga
        if ((isInstalled && _translateUserInitiatedDownload) || (isCompletedNow && isInstalled)) {
            localStorage.setItem('talkme_translate_enabled', 'true');
            _translateUserInitiatedDownload = false;
            _translatePostponedThisSession = false;
            if (_translateDownloadPollInterval) {
                clearInterval(_translateDownloadPollInterval);
                _translateDownloadPollInterval = null;
            }
        }

        const isToggleOn = isTranslationEnabled() && isInstalled;

        if (chk) chk.checked = isToggleOn;
        if (btnToggle) {
            btnToggle.className = `trigger-toggle ${isToggleOn ? 'tgl-on' : 'tgl-off'}`;
            btnToggle.innerText = isToggleOn ? 'ON' : 'OFF';
        }

        if (actionArea) {
            if (isInstalled) {
                actionArea.innerHTML = `
                    <button class="btn-engine-status installed" id="btn-translate-action" onclick="handleTranslateDelete()">
                        <span class="status-text">${installedTxt}</span>
                        <span class="hover-text">${deleteTxt}</span>
                    </button>
                `;
            } else {
                actionArea.innerHTML = `
                    <button class="btn-engine-status not-installed" id="btn-translate-action" onclick="handleTranslateInstall()">
                        ${toInstallTxt}
                    </button>
                `;
            }
        }
    } catch (e) {
        console.warn("⚠️ [TRANSLATE-TAB] Error actualizando estado:", e.message);
    } finally {
        _isUpdatingTranslateTab = false;
    }
}

async function handleTranslateInstall() {
    _translatePostponedThisSession = false;
    _translateUserInitiatedDownload = true;
    _lastTranslateProgressPct = 0;
    const btnToggle = document.getElementById('btnTogglePrelaunchTranslate');
    const chk = document.getElementById('chkPrelaunchTranslate');
    // Mantener explícitamente en OFF hasta que finalice y se verifique la descarga
    if (chk) chk.checked = false;
    if (btnToggle) {
        btnToggle.className = 'trigger-toggle tgl-off';
        btnToggle.innerText = 'OFF';
    }
    const customPath = getEffectiveModelsPath();
    try {
        await fetch('/api/download-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'translate', customPath })
        });
        updatePrelaunchTranslateTab();
        if (_translateDownloadPollInterval) clearInterval(_translateDownloadPollInterval);
        _translateDownloadPollInterval = setInterval(updatePrelaunchTranslateTab, 1000);
    } catch (e) {
        logStatus('Error iniciando descarga del motor de traducción', 'error');
    }
}

async function handleTranslateCancel() {
    // 1. Detener inmediatamente el intervalo de polling y resetear progreso
    if (_translateDownloadPollInterval) {
        clearInterval(_translateDownloadPollInterval);
        _translateDownloadPollInterval = null;
    }
    _translateUserInitiatedDownload = false;
    _lastTranslateProgressPct = 0;

    // 2. Apagar inmediatamente el interruptor en UI y localStorage
    localStorage.setItem('talkme_translate_enabled', 'false');
    const chk = document.getElementById('chkPrelaunchTranslate');
    const btnToggle = document.getElementById('btnTogglePrelaunchTranslate');
    if (chk) chk.checked = false;
    if (btnToggle) {
        btnToggle.className = 'trigger-toggle tgl-off';
        btnToggle.innerText = 'OFF';
    }

    // 3. Ocultar la barra de progreso y volver a renderizar el botón en 'Descargar'
    const progressBox = document.getElementById('engine-translate-progress-box');
    if (progressBox) progressBox.style.display = 'none';

    const actionArea = document.getElementById('engine-translate-action-area');
    const t = translations[currentLang] || translations['en'] || {};
    const toInstallTxt = t.btn_download || 'Instalar';
    if (actionArea) {
        actionArea.innerHTML = `
            <button class="btn-engine-status not-installed" id="btn-translate-action" onclick="handleTranslateInstall()">
                ${toInstallTxt}
            </button>
        `;
    }

    // 4. Notificar al backend de la cancelación
    try {
        await fetch('/api/cancel-download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'translate' })
        });
    } catch (e) {
        console.warn("⚠️ Error cancelando descarga en backend:", e.message);
    }

    // 5. Refrescar estado final defensivo tras un breve respiro para que el backend libere el proceso
    setTimeout(updatePrelaunchTranslateTab, 400);
}

async function handleTranslateDelete() {
    const t = translations[currentLang] || translations['en'] || {};
    const confirmMsg = t.confirm_delete_translate_model || "¿Estás seguro de que deseas eliminar físicamente el motor de traducción (2.75 GB) del disco?";
    if (!confirm(confirmMsg)) return;

    _lastTranslateProgressPct = 0;
    try {
        const customPath = getEffectiveModelsPath();
        const res = await fetch('/api/delete-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'translate', customPath })
        });
        const data = await res.json();
        if (data && data.success) {
            logStatus(t.log_translate_model_deleted || "Modelo de traducción eliminado físicamente para liberar espacio.", 'success');
            localStorage.setItem('talkme_translate_enabled', 'false');
            updatePrelaunchTranslateTab();
        } else {
            logStatus(getLocalizedApiError(data.error, data.error_code) || 'Error eliminando el modelo de traducción', 'error');
        }
    } catch (e) {
        logStatus('Error de red al eliminar el modelo de traducción', 'error');
    }
}

async function startDownloadTranslateProcess() {
    _translatePostponedThisSession = false;
    try { sessionStorage.removeItem('talkme_translate_postponed'); } catch (e) { }
    showDownloadTranslateModal('progress');

    try {
        const customPath = getEffectiveModelsPath();
        const res = await fetch('/api/download-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'translate', customPath })
        });
        const data = await res.json();
        if (!data.success && data.error) {
            alert(data.error);
            showDownloadTranslateModal('decision');
            return;
        }
        console.log("📥 [TRANSLATE DOWNLOAD] Petición enviada al servidor:", data);
    } catch (e) {
        console.error("❌ Error solicitando descarga de translate:", e);
    }

    // Polling inmediato sin esperar
    pollTranslateDownloadProgress();
    if (_translateDownloadPollInterval) clearInterval(_translateDownloadPollInterval);
    _translateDownloadPollInterval = setInterval(pollTranslateDownloadProgress, 600);
}

async function pollTranslateDownloadProgress() {
    if (_isPollingTranslate) return;
    _isPollingTranslate = true;

    try {
        const res = await fetch('/api/download-progress');
        const data = await res.json();

        const barFill = document.getElementById('barFill');
        const lblPercent = document.getElementById('lblPercentage');
        const lblBytes = document.getElementById('lblBytesTransferred');
        const lblSpeed = document.getElementById('lblDownloadSpeed');
        const lblStatus = document.getElementById('lblDownloadingStatus');

        if (data && data.success && data.downloads && data.downloads['translate']) {
            const dl = data.downloads['translate'];

            if (dl.status === 'unzipping') {
                if (barFill) barFill.style.width = '99%';
                if (lblPercent) lblPercent.innerText = '99%';
                if (lblBytes) lblBytes.innerText = (dl.downloaded || '2.75 GB') + ' / ' + (dl.total || '2.75 GB');
                if (lblSpeed) lblSpeed.innerText = dl.speed || 'Descomprimiendo...';
                if (lblStatus) lblStatus.innerText = 'Extrayendo e instalando motor neuronal...';
            } else if (dl.status === 'downloading') {
                const pct = Math.max(0, Math.min(99, dl.progress || 0));
                if (barFill) barFill.style.width = pct + '%';
                if (lblPercent) lblPercent.innerText = pct + '%';
                if (lblBytes) lblBytes.innerText = (dl.downloaded || '0 MB') + ' / ' + (dl.total || '2.75 GB');
                if (lblSpeed) lblSpeed.innerText = dl.speed || '0 MB/s';
                if (lblStatus) lblStatus.innerText = (translations[currentLang] && translations[currentLang].translate_downloading_status) || 'Descargando componentes neuronales...';
            } else if (dl.status === 'completed') {
                if (barFill) barFill.style.width = '100%';
                if (lblPercent) lblPercent.innerText = '100%';
                if (lblBytes) lblBytes.innerText = (dl.total || '2.75 GB') + ' / ' + (dl.total || '2.75 GB');
                if (lblSpeed) lblSpeed.innerText = 'Listo';

                if (_translateDownloadPollInterval) {
                    clearInterval(_translateDownloadPollInterval);
                    _translateDownloadPollInterval = null;
                }

                // Asegurar auto-activación de traducción a ON tras completar descarga con éxito
                localStorage.setItem('talkme_translate_enabled', 'true');
                _translatePostponedThisSession = false;
                _translateUserInitiatedDownload = false;
                _lastTranslateProgressPct = 0;
                if (typeof updatePrelaunchTranslateTab === 'function') {
                    updatePrelaunchTranslateTab();
                }

                const badgeSuccess = document.getElementById('badgeSuccess');
                if (badgeSuccess) badgeSuccess.style.display = 'flex';
                const footerLockStatus = document.getElementById('footerLockStatus');
                if (footerLockStatus) footerLockStatus.style.display = 'none';

                // Restaurar botón de ajustes (llave) si la sesión está activa
                const sessionActive = localStorage.getItem('talkme_session_active') === 'true';
                const btnKeySettings = document.getElementById('btnOpenPrelaunchSettings');
                if (btnKeySettings && sessionActive) {
                    btnKeySettings.style.setProperty('display', 'flex', 'important');
                    btnKeySettings.style.setProperty('opacity', '1', 'important');
                }

                setTimeout(() => {
                    const modal = document.getElementById('downloadTranslateModal');
                    if (modal) {
                        modal.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        modal.style.opacity = '0';
                        modal.style.transform = 'scale(0.96)';
                        setTimeout(() => { modal.style.display = 'none'; }, 500);
                    }
                }, 1500);
                return;
            } else if (dl.status === 'failed') {
                if (_translateDownloadPollInterval) {
                    clearInterval(_translateDownloadPollInterval);
                    _translateDownloadPollInterval = null;
                }
                const modal = document.getElementById('downloadTranslateModal');
                if (modal && modal.style.display === 'flex') {
                    const errMsg = dl.error ? ` (${dl.error})` : '';
                    alert(`⚠️ No se pudo completar la descarga del motor de traducción${errMsg}. Puedes reintentar o continuar sin traducción pulsando Posponer.`);
                    showDownloadTranslateModal('decision');
                }
                return;
            }
        } else {
            // 🛡️ Murphy Fallback: Si no hay descarga activa registrada en memoria, verificar si el archivo ya existe completo en disco
            const customPath = getEffectiveModelsPath();
            const chkRes = await fetch(`/api/check-models?customPath=${encodeURIComponent(customPath)}`);
            const chkData = await chkRes.json();
            if (chkData && chkData.success && chkData.models && chkData.models['translate']) {
                if (_translateDownloadPollInterval) {
                    clearInterval(_translateDownloadPollInterval);
                    _translateDownloadPollInterval = null;
                }

                if (barFill) barFill.style.width = '100%';
                if (lblPercent) lblPercent.innerText = '100%';
                if (lblBytes) lblBytes.innerText = '2.75 GB / 2.75 GB';
                if (lblSpeed) lblSpeed.innerText = 'Listo';

                const badgeSuccess = document.getElementById('badgeSuccess');
                if (badgeSuccess) badgeSuccess.style.display = 'flex';
                const footerLockStatus = document.getElementById('footerLockStatus');
                if (footerLockStatus) footerLockStatus.style.display = 'none';

                const sessionActive = localStorage.getItem('talkme_session_active') === 'true';
                const btnKeySettings = document.getElementById('btnOpenPrelaunchSettings');
                if (btnKeySettings && sessionActive) {
                    btnKeySettings.style.setProperty('display', 'flex', 'important');
                    btnKeySettings.style.setProperty('opacity', '1', 'important');
                }

                setTimeout(() => {
                    const modal = document.getElementById('downloadTranslateModal');
                    if (modal) {
                        modal.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        modal.style.opacity = '0';
                        modal.style.transform = 'scale(0.96)';
                        setTimeout(() => { modal.style.display = 'none'; }, 500);
                    }
                }, 1200);
            }
        }
    } catch (e) {
        console.warn("⚠️ [POLL-TRANSLATE-PROGRESS] Error:", e.message);
    } finally {
        _isPollingTranslate = false;
    }
}

// ═══════════════════════════════════════════════════════════════
// CONTROLADORES DE INTERFAZ: BIENVENIDA TRIAL & RENOVACIÓN RTO
// Cero código muerto, arquitectura modular pura y Ley de Murphy
// ═══════════════════════════════════════════════════════════════

/**
 * Despliega la modal de celebración de prueba gratuita tras registrarse.
 */
function showTrialWelcomeModal(validateData) {
    if (typeof validateData === 'number') {
        validateData = {
            trial_duration_days: validateData,
            expires_raw: new Date(Date.now() + validateData * 86400000).toISOString(),
            license_key: localStorage.getItem('talkme_license') || 'TLKM-TRIAL-2026'
        };
    }
    if (validateData) {
        window._currentTrialWelcomeData = validateData;
    } else if (window._currentTrialWelcomeData) {
        validateData = window._currentTrialWelcomeData;
    }
    const modal = document.getElementById('modalTrialWelcome');
    if (!modal) return;

    const lang = currentLang || 'es';
    const t = translations[lang] || translations['es'] || {};
    let rawExpiry = (validateData && (validateData.expires_raw || validateData.expires_at)) || localStorage.getItem('talkme_license_expiry_raw') || localStorage.getItem('talkme_license_expiry');

    let computedDays = 0;
    if (rawExpiry) {
        const expTime = new Date(rawExpiry).getTime();
        if (!isNaN(expTime) && expTime > Date.now()) {
            computedDays = Math.max(1, Math.round((expTime - Date.now()) / (1000 * 60 * 60 * 24)));
        }
    }

    const trialDays = parseInt(
        (validateData && validateData.trial_duration_days) ||
        localStorage.getItem('talkme_trial_initial_days') ||
        computedDays ||
        '30',
        10
    );
    const remainingDays = computedDays > 0 ? computedDays : trialDays;
    if (!rawExpiry || isNaN(new Date(rawExpiry).getTime())) {
        rawExpiry = new Date(Date.now() + remainingDays * 86400000).toISOString();
    }
    const licenseKey = (validateData && validateData.license_key) || localStorage.getItem('talkme_license') || 'TLKM-TRIAL-2026';

    // 1. Textos e insignias dinámicas usando el diccionario i18n
    const badgeEl = document.getElementById('trialWelcomeBadge');
    if (badgeEl) {
        const badgeTpl = t.trial_welcome_badge || "{days} DÍAS DE ACCESO TOTAL";
        badgeEl.innerText = badgeTpl.replace('{days}', trialDays);
    }

    const titleEl = document.getElementById('trialWelcomeTitle');
    if (titleEl) {
        titleEl.innerText = t.trial_welcome_title || "¡Bienvenido a bordo de Talk-me!";
    }

    const bodyEl = document.getElementById('trialWelcomeTextDynamic');
    if (bodyEl) {
        const bodyTpl = t.trial_welcome_body || "¡Tu cuenta ya está activa! Para celebrarlo, te regalamos {days} días para que pruebes, experimentes y disfrutes de la potencia de la plataforma sin restricciones. ¡Despegamos!";
        bodyEl.innerHTML = bodyTpl.replace('{days}', `<strong>${trialDays}</strong>`);
    }

    // Asegurar sincronización de etiquetas estáticas dentro del modal en los 24 idiomas
    modal.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key && t[key] && el.id !== 'trialWelcomeTitle') {
            el.innerText = t[key];
        }
    });

    // 2. Clave y fecha calculada con el formateador de fechas oficial
    const keyEl = document.getElementById('trialWelcomeLicenseKey');
    if (keyEl) keyEl.innerText = licenseKey;

    const expiryEl = document.getElementById('trialWelcomeExpiryText');
    if (expiryEl) {
        const formattedDate = formatExpiryDate(rawExpiry, lang);
        const validTpl = t.trial_valid_until || "Válida hasta: <strong>{date}</strong> ({days} días restantes)";
        expiryEl.innerHTML = validTpl.replace('{date}', formattedDate).replace('{days}', remainingDays);
    }

    modal.style.display = 'flex';
}

/**
 * Cierra suavemente la modal de bienvenida al pulsar "Ingresar".
 */
function dismissTrialWelcome() {
    localStorage.removeItem('talkme_pending_trial_welcome');
    localStorage.setItem('talkme_trial_welcomed', 'true');

    const modal = document.getElementById('modalTrialWelcome');
    if (modal) {
        modal.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.96)';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
            // Desbloquear la verificación del motor de traducción de fondo
            if (typeof checkAndPromptTranslateDownload === 'function') {
                checkAndPromptTranslateDownload();
            }
        }, 300);
    }
}

/**
 * Copia la clave de licencia de bienvenida al portapapeles.
 */
function copyTrialWelcomeLicense() {
    const key = document.getElementById('trialWelcomeLicenseKey');
    if (key && key.innerText) {
        const lang = currentLang || 'es';
        const t = translations[lang] || translations['es'] || {};
        navigator.clipboard.writeText(key.innerText).then(() => {
            const btn = document.querySelector('.trial-btn-copy');
            if (btn) {
                const prev = t.trial_btn_copy || btn.innerText;
                btn.innerText = t.trial_btn_copied || '¡COPIADA!';
                setTimeout(() => { btn.innerText = (translations[currentLang] && translations[currentLang].trial_btn_copy) || prev; }, 1500);
            }
        }).catch(() => {
            alert(key.innerText);
        });
    }
}

let _currentRtoDetails = null;

/**
 * Muestra la pantalla contextual en 2 columnas cuando la cuota mensual RTO ha vencido.
 */
function showRtoRenewalScreen(details) {
    _currentRtoDetails = details;
    const secLogin = document.getElementById('sec-login');
    const secRegister = document.getElementById('sec-register');
    const secValidate = document.getElementById('sec-validate');
    const secStripe = document.getElementById('sec-stripe');
    const secRto = document.getElementById('sec-rto-renewal');
    const btnKey = document.getElementById('btnOpenPrelaunchSettings');
    const customAlert = document.getElementById('customAlertModal');

    // Cerrar cualquier alerta modal emergente para que no tape la pantalla RTO
    if (customAlert) {
        customAlert.classList.add('hidden');
        customAlert.style.display = 'none';
    }

    if (secLogin) secLogin.style.display = 'none';
    if (secRegister) secRegister.style.display = 'none';
    if (secValidate) secValidate.style.display = 'none';
    if (secStripe) secStripe.style.display = 'none';
    if (btnKey) btnKey.style.display = 'none';

    if (!secRto) return;

    const lang = currentLang || 'es';
    const t = translations[lang] || translations['es'] || {};
    const email = details.email || localStorage.getItem('talkme_email') || 'usuario@talk-me.app';
    const licenseKey = details.license_key || localStorage.getItem('talkme_license') || 'N/A';
    const planType = (details.plan_type === 'enterprise')
        ? (t.rto_plan_enterprise || 'ENTERPRISE (5 Servidores)')
        : (t.rto_plan_freelance || 'FREELANCE (1 Servidor)');
    const paidCount = parseInt(details.paid_count || 0, 10);
    const totalCount = parseInt(details.total_count || 14, 10);
    const remainingCount = Math.max(0, totalCount - paidCount);
    const monthlyPrice = parseFloat(details.monthly_price || (details.plan_type === 'enterprise' ? 49.90 : 9.99));
    const buyoutPrice = parseFloat(details.buyout_price || (remainingCount * monthlyPrice).toFixed(2));
    const totalPaidNum = parseFloat(details.total_paid !== undefined ? details.total_paid : (paidCount * monthlyPrice));
    const totalNetNum = totalCount * monthlyPrice;
    const percent = Math.min(100, Math.round((paidCount / totalCount) * 100));

    // Inyección de datos localizados en los 24 idiomas
    const emailEl = document.getElementById('rto-user-email');
    if (emailEl) emailEl.innerText = email;

    const keyEl = document.getElementById('rto-license-key-text');
    if (keyEl) keyEl.innerText = licenseKey;

    const planEl = document.getElementById('rto-plan-type-text');
    if (planEl) planEl.innerText = planType;

    const percentEl = document.getElementById('rto-progress-percent');
    if (percentEl) {
        const progTpl = t.rto_progress_paid || "Progreso: {percent}% pagado";
        percentEl.innerText = progTpl.replace('{percent}', percent);
    }

    const fractionEl = document.getElementById('rto-fraction-text');
    if (fractionEl) {
        const fracTpl = t.rto_installments_fraction || "{paid} de {total} cuotas";
        fractionEl.innerText = fracTpl.replace('{paid}', paidCount).replace('{total}', totalCount);
    }

    const fillEl = document.getElementById('rto-progress-fill');
    if (fillEl) fillEl.style.width = `${percent}%`;

    const legendEl = document.getElementById('rto-summary-legend');
    if (legendEl) {
        const legTpl = t.rto_summary_legend || "{paid_amount} abonados de {total_amount} • Restan <strong>{remaining} meses</strong> para propiedad vitalicia.";
        legendEl.innerHTML = legTpl
            .replace('{paid_amount}', formatCurrency(totalPaidNum, lang))
            .replace('{total_amount}', formatCurrency(totalNetNum, lang))
            .replace('{remaining}', remainingCount);
    }

    const col1Desc = document.getElementById('rto-col1-desc');
    if (col1Desc) {
        const col1Tpl = t.rto_col1_desc || "Paga la cuota <strong>{next}</strong> para reactivar tu servidor durante 30 días más.";
        col1Desc.innerHTML = col1Tpl.replace('{next}', paidCount + 1);
    }

    const monthlyBtnLabel = document.getElementById('rto-btn-monthly-label');
    if (monthlyBtnLabel) {
        const btn1Tpl = t.rto_btn_pay_installment || "Pagar Cuota {next} ({price})";
        monthlyBtnLabel.innerText = btn1Tpl
            .replace('{next}', paidCount + 1)
            .replace('{price}', formatCurrency(monthlyPrice, lang));
    }

    const buyoutBtnLabel = document.getElementById('rto-buyout-amount-label');
    if (buyoutBtnLabel) {
        buyoutBtnLabel.innerText = `(${formatCurrency(buyoutPrice, lang)})`;
    }

    const dashboardEl = document.querySelector('.dashboard');
    if (dashboardEl) {
        dashboardEl.classList.add('has-rto-renewal');
    }

    secRto.style.display = 'block';
}

/**
 * Ejecuta el pago de la cuota mensual ordinaria RTO a través de la pasarela Stripe exacta.
 */
async function executeRtoMonthlyPayment() {
    const licenseKey = (_currentRtoDetails && _currentRtoDetails.license_key) || localStorage.getItem('talkme_license') || '';
    const lang = currentLang || 'es';
    logStatus(translations[lang].log_redirecting_stripe || "Redirigiendo a la pasarela segura de Stripe...");

    try {
        const res = await fetch('/api/create-rto-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                licenseKey: licenseKey,
                type: 'monthly',
                lang: lang,
                origin: window.location.origin
            })
        });
        const data = await res.json();
        if (data.success && data.url) {
            const popup = window.open(data.url, '_blank');
            if (!popup) {
                window.location.href = data.url;
            }
            const email = (_currentRtoDetails && _currentRtoDetails.email) || localStorage.getItem('talkme_email') || '';
            const userId = (_currentRtoDetails && _currentRtoDetails.user_id) || localStorage.getItem('talkme_user_id') || 0;
            startPaymentPolling(userId, email);
        } else {
            const plan = (_currentRtoDetails && _currentRtoDetails.plan_type) || 'freelance';
            buyLicense(plan, 'rent_to_own');
        }
    } catch (e) {
        console.warn("⚠️ Error solicitando sesión RTO, ejecutando fallback:", e);
        const plan = (_currentRtoDetails && _currentRtoDetails.plan_type) || 'freelance';
        buyLicense(plan, 'rent_to_own');
    }
}

/**
 * Ejecuta la liquidación de golpe (Buyout) descontando estrictamente las cuotas ya amortizadas.
 */
async function executeRtoBuyoutPayment() {
    const licenseKey = (_currentRtoDetails && _currentRtoDetails.license_key) || localStorage.getItem('talkme_license') || '';
    const lang = currentLang || 'es';
    logStatus(translations[lang].log_redirecting_stripe || "Redirigiendo a la pasarela segura de Stripe...");

    try {
        const res = await fetch('/api/create-rto-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                licenseKey: licenseKey,
                type: 'buyout',
                lang: lang,
                origin: window.location.origin
            })
        });
        const data = await res.json();
        if (data.success && data.url) {
            const popup = window.open(data.url, '_blank');
            if (!popup) {
                window.location.href = data.url;
            }
            const email = (_currentRtoDetails && _currentRtoDetails.email) || localStorage.getItem('talkme_email') || '';
            const userId = (_currentRtoDetails && _currentRtoDetails.user_id) || localStorage.getItem('talkme_user_id') || 0;
            startPaymentPolling(userId, email);
        } else {
            const plan = (_currentRtoDetails && _currentRtoDetails.plan_type) || 'freelance';
            buyLicense(plan, 'one_time');
        }
    } catch (e) {
        console.warn("⚠️ Error solicitando buyout RTO, ejecutando fallback:", e);
        const plan = (_currentRtoDetails && _currentRtoDetails.plan_type) || 'freelance';
        buyLicense(plan, 'one_time');
    }
}
