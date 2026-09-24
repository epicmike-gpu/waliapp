/**
 * 《用户协议》与《隐私政策》正文数据（双语）
 * - cn 版：国内合规措辞（个保法、京东渠道说明）
 * - en 版：国际通用措辞（data controller、GDPR 风格权利、generic marketplace）
 * 协议页（screens/agreement）与首启同意弹窗（components/AgreementGate）共用，
 * 更新条款后请同步递增 utils/agreement.ts 中的 AGREEMENT_VERSION。
 */
import type { Lang } from '@/i18n';

export interface AgreementSection {
  heading: string;
  paragraphs: string[];
}

export interface AgreementDoc {
  title: string;
  effectiveDate: string;
  sections: AgreementSection[];
}

/* ═══════════════ 中文（国内版） ═══════════════ */

const USER_AGREEMENT_ZH: AgreementDoc = {
  title: '瓦砾用户协议',
  effectiveDate: '2026年9月22日',
  sections: [
    {
      heading: '一、协议的确认与接受',
      paragraphs: [
        '欢迎使用「瓦砾」（以下简称"本应用"）。本协议是您与本应用开发者（以下简称"开发者"）之间就使用本应用服务所订立的协议。',
        '您在首次启动时勾选或点击"同意"即视为您已充分阅读、理解并接受本协议全部内容。若您不同意本协议任何条款，请停止使用本应用。',
        '本应用功能面向具备完全民事行为能力的用户；若您是未满十四周岁的未成年人，请在监护人陪同下阅读本协议并在征得监护人同意后使用。',
      ],
    },
    {
      heading: '二、服务说明',
      paragraphs: [
        '本应用为设备换机评估工具，提供机型参数库查询、基于芯片代差/系统支持年限/实测性能与电池健康度的换机评分、用机画像分析及同价位机型对比等服务。',
        '本应用提供的评分、建议与对比结果均由算法基于公开参数与您主动录入的数据自动生成，仅供参考，不构成任何消费决策依据或商业承诺。',
        '开发者有权基于产品迭代对服务内容进行调整、优化或中止，并将通过应用内公告等合理方式通知。',
      ],
    },
    {
      heading: '三、用户行为规范',
      paragraphs: [
        '您承诺通过本应用录入的数据（如跑分、电池健康度等）真实、准确，因录入虚假数据导致的评估偏差由您自行承担。',
        '您不得利用本应用从事任何违反法律法规、危害网络安全或侵犯他人合法权益的行为；不得对本应用进行反向工程、批量抓取或干扰其正常运行。',
      ],
    },
    {
      heading: '四、知识产权',
      paragraphs: [
        '本应用的界面设计、评分算法、文案及代码的知识产权归开发者所有。',
        '本应用中展示的手机产品名称（如 iPhone）、产品渲染图及相关标识，其商标权与著作权归 Apple Inc. 及相应权利人所有，仅用于机型识别与参考展示，不代表本应用与权利人存在任何合作或授权关系。',
        '若您认为本应用内容侵犯了您的合法权益，请通过本应用应用商店页面所载开发者联系方式提出，我们将及时核实并处理。',
      ],
    },
    {
      heading: '五、免责声明',
      paragraphs: [
        '本应用按"现状"提供服务，因不可抗力、系统维护、第三方服务调整（如第三方平台商品信息变更）导致服务中断或数据偏差的，开发者不承担由此产生的直接损失。',
        '您理解并同意：换机评分与导购信息存在时效性，实际购买决策请以第三方平台（如京东）展示的最新信息为准；因购买行为产生的交易纠纷请您与商品或服务提供方协商解决。',
      ],
    },
    {
      heading: '六、协议的变更与终止',
      paragraphs: [
        '开发者可能适时修订本协议，修订后的协议将在应用内公布；若您在协议变更后继续使用本应用，视为接受修订后的协议。',
        '您可随时停止使用本应用并通过应用内"清除设备配置"功能删除本地数据；停止使用后本协议对您的效力即告终止，但已产生的历史数据除外。',
      ],
    },
    {
      heading: '七、法律适用与争议解决',
      paragraphs: [
        '本协议适用中华人民共和国大陆地区法律。',
        '因本协议产生的争议，双方应友好协商解决；协商不成的，任何一方可向开发者所在地有管辖权的人民法院提起诉讼。',
      ],
    },
    {
      heading: '八、联系我们',
      paragraphs: [
        '如对本协议内容有任何疑问、意见或建议，可通过 App Store 应用详情页中"开发者信息"所载联系方式与我们联系，我们将在收到反馈后 15 个工作日内回复。',
      ],
    },
  ],
};

const PRIVACY_POLICY_ZH: AgreementDoc = {
  title: '瓦砾隐私政策',
  effectiveDate: '2026年9月22日',
  sections: [
    {
      heading: '一、引言',
      paragraphs: [
        '「瓦砾」（以下简称"本应用"）深知个人信息对您的重要性，我们将按照《中华人民共和国个人信息保护法》《中华人民共和国网络安全法》等法律法规要求，以最小必要原则处理您的个人信息。',
        '请您在使用本应用前仔细阅读本政策，重点了解我们收集哪些信息、如何使用与保护这些信息，以及您享有的权利。',
      ],
    },
    {
      heading: '二、我们收集和使用的信息',
      paragraphs: [
        '1. 设备基础信息：当您使用"自动识别机型"功能时，本应用会读取您手机的系统名称与系统版本号，用于在本应用机型库中匹配对应机型。该信息仅在本机处理，不会单独上传或用于识别您的个人身份。',
        '2. 您主动录入的信息：您在配置设备时主动填写的跑分数据、电池健康度、电池循环次数、流畅度感受及常用 App 使用偏好。这些信息存储于您的设备本地，用于生成换机评分与建议。',
        '3. 设备标识符：本应用会在首次启动时生成一串随机标识符（UUID）并存储于您的设备本地，用于区分不同设备，不包含 IMEI、IDFA 等系统级唯一标识。',
        '4. 日志信息：当您使用换机分析等服务时，服务器会记录必要的请求日志（如请求时间、返回状态），用于保障服务稳定与排查故障，日志中不含可识别您个人身份的内容。',
      ],
    },
    {
      heading: '三、我们如何使用信息',
      paragraphs: [
        '上述信息仅用于：生成换机评分与建议、维护机型参数库、保障应用安全稳定运行。',
        '我们不会将您的信息用于个性化广告推送，不会出售您的任何信息。',
      ],
    },
    {
      heading: '四、信息的存储与保护',
      paragraphs: [
        '您的设备配置、常用 App 偏好等数据存储于设备本地（AsyncStorage），直至您主动清除；您可通过"我的"页面中的"清除设备配置"功能随时删除全部本地数据。',
        '本应用传输数据时采用加密通道（HTTPS）；开发者将采取访问控制、日志脱敏等安全措施防止信息被未经授权地访问、篡改或泄露。',
        '如不幸发生个人信息安全事件，我们将按照法律法规要求及时告知您，并采取合理的补救措施。',
      ],
    },
    {
      heading: '五、对外提供与第三方服务',
      paragraphs: [
        '我们不会向任何第三方共享、转让您的个人信息，但以下情形除外：事先获得您的明确授权；根据法律法规或司法机关的强制性要求。',
        '本应用提供跳转至第三方平台（如京东）的导购链接：当您点击跳转后，您的浏览与交易行为将受该第三方平台隐私政策约束，请审慎阅读。本应用不获取您在第三方平台内的任何账户或交易信息。',
        '截至本政策更新之日，本应用未接入任何广告追踪 SDK 或数据统计分析 SDK。',
      ],
    },
    {
      heading: '六、您的权利',
      paragraphs: [
        '按照相关法律法规，您对自己的个人信息享有查询、更正、删除的权利：',
        '· 查询与更正：您可在"我的"页面随时查看并修改已录入的设备配置；',
        '· 删除：您可通过"清除设备配置"一键删除全部本地数据，删除后不可恢复；',
        '· 撤回同意：您可以拒绝同意本政策而不使用本应用，或随时停止使用以撤回授权。',
      ],
    },
    {
      heading: '七、未成年人保护',
      paragraphs: [
        '本应用主要面向成年用户。我们不会主动收集未成年人的个人信息；若您是未满十四周岁未成年人的监护人，发现被监护人在未征得您同意的情况下使用了本应用，请通过应用商店页面所载开发者联系方式与我们联系，我们将协助删除相关数据。',
      ],
    },
    {
      heading: '八、政策的更新',
      paragraphs: [
        '本政策可能适时更新。发生重大变更（如新增信息收集项、新增第三方服务）时，我们将在您下次启动应用时再次弹窗征求您的同意，并更新生效日期。',
      ],
    },
    {
      heading: '九、联系我们',
      paragraphs: [
        '如您对本政策有任何疑问、意见或投诉，可通过 App Store 应用详情页中"开发者信息"所载联系方式与我们联系，我们将在 15 个工作日内答复。',
      ],
    },
  ],
};

/* ═══════════════ English (international edition) ═══════════════ */

const USER_AGREEMENT_EN: AgreementDoc = {
  title: 'value Terms of Use',
  effectiveDate: 'September 22, 2026',
  sections: [
    {
      heading: '1. Acceptance of Terms',
      paragraphs: [
        'Welcome to "value" (the "App"). These Terms of Use ("Terms") form an agreement between you and the developer of the App (the "Developer") governing your use of the App.',
        'By tapping "Agree" on first launch, you confirm that you have read, understood and accepted these Terms in full. If you do not agree to any part of these Terms, please stop using the App.',
        'The App is intended for users with full legal capacity. If you are under the age of digital consent in your jurisdiction, please review these Terms with a parent or guardian and use the App only with their consent.',
      ],
    },
    {
      heading: '2. The Service',
      paragraphs: [
        'The App is a device trade-in evaluation tool. It provides a device catalog, a switch score based on chip generation, OS support horizon, measured performance and battery health, a usage profile analysis, and peer-model comparison.',
        'All scores, suggestions and comparisons are generated automatically by an algorithm based on public specifications and the data you enter. They are provided for reference only and do not constitute consumer advice, warranties or commitments of any kind.',
        'The Developer may adjust, improve or discontinue parts of the Service as the product evolves, and will provide notice through in-app announcements where reasonably practicable.',
      ],
    },
    {
      heading: '3. Acceptable Use',
      paragraphs: [
        'You agree that the data you enter (such as benchmark scores and battery health) is true and accurate to the best of your knowledge; you are responsible for evaluation errors caused by inaccurate data.',
        'You must not use the App for any unlawful purpose, to harm networks or third parties, or to reverse engineer, bulk-scrape or interfere with the normal operation of the App.',
      ],
    },
    {
      heading: '4. Intellectual Property',
      paragraphs: [
        'The App\u2019s interface design, scoring algorithms, copy and code are owned by the Developer.',
        'Phone product names (e.g. iPhone), product renders and related marks shown in the App are trademarks and copyrights of Apple Inc. and their respective owners. They are displayed solely for model identification and reference, and do not imply any partnership with or endorsement by the rights holders.',
        'If you believe any content in the App infringes your rights, please contact us via the developer contact information listed on the App Store product page. We will verify and address valid requests promptly.',
      ],
    },
    {
      heading: '5. Disclaimers',
      paragraphs: [
        'The App is provided "as is". The Developer is not liable for service interruptions or data discrepancies caused by force majeure, system maintenance or changes to third-party services (such as product information on third-party marketplaces).',
        'You understand that switch scores and shopping suggestions are time-sensitive. Purchase decisions should be based on the latest information shown on the relevant third-party marketplace; any transaction disputes should be resolved with the seller or service provider.',
      ],
    },
    {
      heading: '6. Changes and Termination',
      paragraphs: [
        'The Developer may revise these Terms from time to time and will publish updated Terms in the App. Continuing to use the App after a change constitutes acceptance of the revised Terms.',
        'You may stop using the App at any time and delete your local data with the "Clear device data" function. Upon cessation, these Terms terminate with respect to you, except for data already generated.',
      ],
    },
    {
      heading: '7. Governing Law and Disputes',
      paragraphs: [
        'These Terms are governed by the laws applicable at the Developer\u2019s principal place of business, without prejudice to mandatory consumer protection rights in your country of residence.',
        'Disputes arising from these Terms should first be resolved amicably through negotiation; failing that, either party may bring the dispute before a court of competent jurisdiction.',
      ],
    },
    {
      heading: '8. Contact Us',
      paragraphs: [
        'For questions, comments or suggestions about these Terms, contact us via the developer contact information listed on the App Store product page. We aim to respond within 15 business days.',
      ],
    },
  ],
};

const PRIVACY_POLICY_EN: AgreementDoc = {
  title: 'value Privacy Policy',
  effectiveDate: 'September 22, 2026',
  sections: [
    {
      heading: '1. Introduction',
      paragraphs: [
        '"value" (the "App") respects your privacy. The Developer processes personal data on the principle of data minimisation, in line with applicable data protection laws (which may include the EU/UK GDPR and similar regulations, where applicable).',
        'Please read this policy carefully before using the App — it explains what data we collect, how we use and protect it, and the rights you have.',
      ],
    },
    {
      heading: '2. Data We Collect and Use',
      paragraphs: [
        '1. Basic device information: when you use "auto-detect", the App reads your phone\u2019s system name and version to match a model in our catalog. This is processed on-device and is not uploaded on its own, nor used to identify you personally.',
        '2. Information you enter: benchmark scores, battery health, battery charge cycles, smoothness self-rating and your preferred app categories. These are stored locally on your device and used to generate your switch score and suggestions.',
        '3. Device identifier: on first launch the App generates a random identifier (UUID) stored locally to distinguish devices. It contains no system-level identifiers such as IMEI or IDFA.',
        '4. Logs: when you use features such as switch analysis, servers record necessary request logs (e.g. timestamp, response status) to keep the service stable and debug issues. Logs do not contain information identifying you personally.',
      ],
    },
    {
      heading: '3. How We Use Data',
      paragraphs: [
        'The data above is used only to: generate your switch score and suggestions, maintain the device catalog, and keep the App secure and stable.',
        'We do not use your data for personalised advertising and we do not sell any of your data.',
      ],
    },
    {
      heading: '4. Storage and Protection',
      paragraphs: [
        'Your device configuration and app preferences are stored locally on your device (AsyncStorage) until you delete them; you can erase all local data at any time via "Clear device data" on the Device tab.',
        'Data in transit is protected by an encrypted channel (HTTPS). The Developer applies access controls, log de-identification and other security measures against unauthorised access, alteration or disclosure.',
        'In the unlikely event of a personal data security incident, we will inform you as required by applicable law and take reasonable remedial measures.',
      ],
    },
    {
      heading: '5. Sharing and Third-Party Services',
      paragraphs: [
        'We do not share or transfer your personal data to third parties, except: with your explicit prior consent, or where required by law or a competent authority.',
        'The App may offer links to third-party marketplaces: once you tap through, your browsing and transactions are governed by that platform\u2019s privacy policy — please review it carefully. The App does not access any of your accounts or transaction data on those platforms.',
        'As of the effective date of this policy, the App integrates no advertising-tracking SDK and no analytics SDK.',
      ],
    },
    {
      heading: '6. Your Rights',
      paragraphs: [
        'Subject to applicable law, you have the following rights over your personal data:',
        '· Access and rectification: view and edit your device configuration at any time on the Device tab;',
        '· Erasure: delete all local data with one tap via "Clear device data"; deletion is irreversible;',
        '· Withdraw consent: decline this policy and not use the App, or stop using the App at any time to withdraw consent.',
      ],
    },
    {
      heading: '7. Children',
      paragraphs: [
        'The App is directed at adult users. We do not knowingly collect personal data from children. If you are a parent or guardian and believe a child has used the App without your consent, contact us via the developer contact information on the App Store product page and we will help delete the relevant data.',
      ],
    },
    {
      heading: '8. Changes to This Policy',
      paragraphs: [
        'This policy may be updated from time to time. For material changes (e.g. new data collection or new third-party services), we will ask for your consent again via a dialog at next launch and update the effective date.',
      ],
    },
    {
      heading: '9. Contact Us',
      paragraphs: [
        'For questions, comments or complaints about this policy, contact us via the developer contact information listed on the App Store product page. We aim to respond within 15 business days.',
      ],
    },
  ],
};

/* ═══════════════ 导出 ═══════════════ */

export const AGREEMENT_DOCS: Record<Lang, { user: AgreementDoc; privacy: AgreementDoc }> = {
  zh: { user: USER_AGREEMENT_ZH, privacy: PRIVACY_POLICY_ZH },
  en: { user: USER_AGREEMENT_EN, privacy: PRIVACY_POLICY_EN },
};

export function getAgreementDoc(lang: Lang, type: 'user' | 'privacy'): AgreementDoc {
  return AGREEMENT_DOCS[lang][type];
}
