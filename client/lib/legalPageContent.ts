import { normalizeLanguage, type SupportedLanguage } from "./language";

export type LegalPageId = "privacy" | "terms";

type LegalListItem = {
	label?: string;
	text: string;
};

type LegalSubsection = {
	heading: string;
	paragraphs: string[];
};

type LegalSection = {
	heading: string;
	paragraphs?: string[];
	listItems?: LegalListItem[];
	subsections?: LegalSubsection[];
};

export type LegalPageContent = {
	headTitle: string;
	metaDescription: string;
	pageTitle: string;
	lastUpdatedLabel: string;
	lastUpdatedDate: string;
	sections: LegalSection[];
};

const legalPageContent: Record<
	LegalPageId,
	Record<SupportedLanguage, LegalPageContent>
> = {
	privacy: {
		en: {
			headTitle: "Privacy Policy – mdto.page",
			metaDescription:
				"Read the Privacy Policy for mdto.page to understand how we collect, use, and protect your data.",
			pageTitle: "Privacy Policy",
			lastUpdatedLabel: "Last updated:",
			lastUpdatedDate: "Jan 25, 2026",
			sections: [
				{
					heading: "1. Information We Collect",
					paragraphs: [
						"We collect information that you strictly provide to us for the purpose of using the Service:",
					],
					listItems: [
						{
							label: "Content:",
							text: "The Markdown text and files you upload to be rendered.",
						},
						{
							label: "Account Information:",
							text: "If you choose to sign in (via GitHub), we collect your email address and basic profile information to create and manage your account.",
						},
						{
							label: "Usage Data:",
							text: "We may collect anonymous metrics to understand how the Service is used and to improve performance.",
						},
					],
				},
				{
					heading: "2. Data Retention",
					paragraphs: [
						"Our data retention policy differs depending on whether you are using the Service as a guest or as a registered user:",
					],
					subsections: [
						{
							heading: "Guest Users (No Login)",
							paragraphs: [
								"Content uploaded without logging in is considered temporary. It is stored for a limited period and will be automatically deleted after its expiration time. We do not guarantee permanent storage for guest uploads.",
							],
						},
						{
							heading: "Registered Users (Logged In)",
							paragraphs: [
								"Content uploaded while logged in is retained indefinitely. Your data is preserved in your dashboard to help you build and manage your personal library of pages. This content will be kept until you decide to delete it manually.",
							],
						},
					],
				},
				{
					heading: "3. How We Use Your Information",
					paragraphs: [
						"We use the information we collect solely to provide, maintain, and improve the Service. We do not sell your personal data or content to third parties. Your uploaded Markdown content is processed for the purpose of rendering it into web pages.",
					],
				},
				{
					heading: "4. Cookies",
					paragraphs: [
						"We use cookies and similar tracking technologies primarily for authentication purposes to keep you logged in. You can instruct your browser to refuse all cookies, but you may not be able to use the persistent storage features of the Service if you do so.",
					],
				},
				{
					heading: "5. Data Security",
					paragraphs: [
						"We strive to use commercially acceptable means to protect your personal data and content. However, no method of transmission over the Internet or electronic storage is 100% secure.",
					],
				},
				{
					heading: "6. Changes to This Privacy Policy",
					paragraphs: [
						"We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.",
					],
				},
			],
		},
		"ko-kr": {
			headTitle: "개인정보처리방침 – mdto.page",
			metaDescription:
				"mdto.page가 어떤 데이터를 수집하고, 어떻게 사용하며, 어떻게 보호하는지 개인정보처리방침에서 확인하세요.",
			pageTitle: "개인정보처리방침",
			lastUpdatedLabel: "최종 업데이트:",
			lastUpdatedDate: "2026년 1월 25일",
			sections: [
				{
					heading: "1. 수집하는 정보",
					paragraphs: [
						"서비스를 제공하기 위해 사용자가 직접 제공한 정보만 수집합니다:",
					],
					listItems: [
						{
							label: "콘텐츠:",
							text: "렌더링을 위해 업로드한 Markdown 텍스트와 파일.",
						},
						{
							label: "계정 정보:",
							text: "GitHub로 로그인하면 계정 생성 및 관리를 위해 이메일 주소와 기본 프로필 정보를 수집합니다.",
						},
						{
							label: "사용 데이터:",
							text: "서비스 사용 방식과 성능 개선을 이해하기 위해 익명 지표를 수집할 수 있습니다.",
						},
					],
				},
				{
					heading: "2. 데이터 보관",
					paragraphs: [
						"데이터 보관 정책은 게스트 사용자인지 등록 사용자인지에 따라 달라집니다:",
					],
					subsections: [
						{
							heading: "게스트 사용자 (비로그인)",
							paragraphs: [
								"로그인 없이 업로드한 콘텐츠는 임시 데이터로 간주됩니다. 제한된 기간 동안 저장되며 만료 시간이 지나면 자동으로 삭제됩니다. 게스트 업로드에 대해서는 영구 보관을 보장하지 않습니다.",
							],
						},
						{
							heading: "등록 사용자 (로그인)",
							paragraphs: [
								"로그인 상태에서 업로드한 콘텐츠는 무기한 보관됩니다. 대시보드에서 페이지 라이브러리를 구축하고 관리할 수 있도록 데이터가 유지되며, 사용자가 직접 삭제할 때까지 보관됩니다.",
							],
						},
					],
				},
				{
					heading: "3. 정보 사용 방식",
					paragraphs: [
						"수집한 정보는 서비스를 제공, 유지, 개선하는 목적으로만 사용합니다. 개인정보나 콘텐츠를 제3자에게 판매하지 않습니다. 업로드한 Markdown 콘텐츠는 웹 페이지로 렌더링하기 위한 목적으로 처리됩니다.",
					],
				},
				{
					heading: "4. 쿠키",
					paragraphs: [
						"쿠키와 유사한 추적 기술은 주로 로그인 상태 유지를 위한 인증 목적으로 사용합니다. 브라우저에서 모든 쿠키를 거부하도록 설정할 수 있지만, 그 경우 서비스의 영구 저장 기능을 사용하지 못할 수 있습니다.",
					],
				},
				{
					heading: "5. 데이터 보안",
					paragraphs: [
						"개인정보와 콘텐츠를 보호하기 위해 상업적으로 합리적인 수단을 사용하려고 노력합니다. 다만 인터넷 전송이나 전자 저장 방식 중 100% 안전한 방법은 없습니다.",
					],
				},
				{
					heading: "6. 개인정보처리방침 변경",
					paragraphs: [
						"개인정보처리방침은 수시로 업데이트될 수 있습니다. 변경 사항이 있으면 이 페이지에 새 방침을 게시하여 안내합니다. 정기적으로 내용을 확인해 주세요.",
					],
				},
			],
		},
		"zh-cn": {
			headTitle: "隐私政策 – mdto.page",
			metaDescription:
				"阅读 mdto.page 的隐私政策，了解我们如何收集、使用和保护你的数据。",
			pageTitle: "隐私政策",
			lastUpdatedLabel: "最后更新：",
			lastUpdatedDate: "2026年1月25日",
			sections: [
				{
					heading: "1. 我们收集的信息",
					paragraphs: ["我们仅收集你为使用本服务而主动提供的信息："],
					listItems: [
						{
							label: "内容：",
							text: "你上传用于渲染的 Markdown 文本和文件。",
						},
						{
							label: "账户信息：",
							text: "如果你选择使用 GitHub 登录，我们会收集你的电子邮箱地址和基础资料，用于创建和管理账户。",
						},
						{
							label: "使用数据：",
							text: "我们可能会收集匿名指标，以了解服务的使用方式并改进性能。",
						},
					],
				},
				{
					heading: "2. 数据保留",
					paragraphs: [
						"数据保留策略会根据你是访客用户还是注册用户而有所不同：",
					],
					subsections: [
						{
							heading: "访客用户（未登录）",
							paragraphs: [
								"未登录时上传的内容会被视为临时内容。它只会保存一段有限时间，并会在过期后自动删除。我们不保证访客上传内容会被永久保存。",
							],
						},
						{
							heading: "注册用户（已登录）",
							paragraphs: [
								"登录状态下上传的内容会被长期保留。你的数据会保存在仪表盘中，方便你建立和管理自己的页面库，直到你手动删除为止。",
							],
						},
					],
				},
				{
					heading: "3. 我们如何使用你的信息",
					paragraphs: [
						"我们仅将收集到的信息用于提供、维护和改进本服务。我们不会将你的个人数据或内容出售给第三方。你上传的 Markdown 内容仅用于将其渲染为网页。",
					],
				},
				{
					heading: "4. Cookies",
					paragraphs: [
						"我们使用 Cookies 和类似的跟踪技术，主要用于身份验证和保持登录状态。你可以让浏览器拒绝所有 Cookies，但这样可能无法使用服务中的持久化存储功能。",
					],
				},
				{
					heading: "5. 数据安全",
					paragraphs: [
						"我们会尽力采用合理的商业手段来保护你的个人数据和内容。但无论是互联网传输还是电子存储，都不存在 100% 安全的方法。",
					],
				},
				{
					heading: "6. 隐私政策变更",
					paragraphs: [
						"我们可能会不时更新隐私政策。若有变更，我们会在此页面发布新的隐私政策。建议你定期查看本页面。",
					],
				},
			],
		},
		"ja-jp": {
			headTitle: "プライバシーポリシー – mdto.page",
			metaDescription:
				"mdto.page がどのようにデータを収集、利用、保護するかをプライバシーポリシーでご確認ください。",
			pageTitle: "プライバシーポリシー",
			lastUpdatedLabel: "最終更新:",
			lastUpdatedDate: "2026年1月25日",
			sections: [
				{
					heading: "1. 収集する情報",
					paragraphs: [
						"本サービスの利用にあたり、ユーザーが直接提供した情報のみを収集します:",
					],
					listItems: [
						{
							label: "コンテンツ:",
							text: "レンダリングのためにアップロードした Markdown テキストとファイル。",
						},
						{
							label: "アカウント情報:",
							text: "GitHub でサインインした場合、アカウントの作成と管理のためにメールアドレスと基本プロフィール情報を収集します。",
						},
						{
							label: "利用データ:",
							text: "サービスの利用状況を把握し、性能を改善するために匿名の指標を収集することがあります。",
						},
					],
				},
				{
					heading: "2. データ保持",
					paragraphs: [
						"データ保持ポリシーは、ゲストユーザーか登録ユーザーかによって異なります:",
					],
					subsections: [
						{
							heading: "ゲストユーザー（未ログイン）",
							paragraphs: [
								"ログインせずにアップロードされたコンテンツは一時的なものとして扱われます。一定期間のみ保存され、有効期限を過ぎると自動的に削除されます。ゲストによるアップロードの恒久保存は保証しません。",
							],
						},
						{
							heading: "登録ユーザー（ログイン済み）",
							paragraphs: [
								"ログインした状態でアップロードされたコンテンツは無期限で保持されます。ダッシュボード上で自分のページライブラリを構築・管理できるように保存され、ユーザーが手動で削除するまで保持されます。",
							],
						},
					],
				},
				{
					heading: "3. 情報の利用方法",
					paragraphs: [
						"収集した情報は、本サービスの提供、維持、改善のためにのみ使用します。個人データやコンテンツを第三者に販売することはありません。アップロードされた Markdown コンテンツは、ウェブページとしてレンダリングする目的で処理されます。",
					],
				},
				{
					heading: "4. Cookie",
					paragraphs: [
						"Cookie および類似の追跡技術は、主に認証とログイン状態の維持のために使用します。ブラウザですべての Cookie を拒否することもできますが、その場合はサービスの永続保存機能を利用できない可能性があります。",
					],
				},
				{
					heading: "5. データセキュリティ",
					paragraphs: [
						"個人データとコンテンツを保護するため、商業的に合理的な手段を用いるよう努めます。ただし、インターネット経由の送信や電子保存に 100% 安全な方法はありません。",
					],
				},
				{
					heading: "6. プライバシーポリシーの変更",
					paragraphs: [
						"プライバシーポリシーは随時更新される場合があります。変更がある場合は、このページに新しいポリシーを掲載してお知らせします。定期的にご確認ください。",
					],
				},
			],
		},
	},
	terms: {
		en: {
			headTitle: "Terms of Service – mdto.page",
			metaDescription:
				"Read the Terms of Service for mdto.page regarding the use of our markdown sharing platform.",
			pageTitle: "Terms of Service",
			lastUpdatedLabel: "Last updated:",
			lastUpdatedDate: "Jan 25, 2026",
			sections: [
				{
					heading: "1. Acceptance of Terms",
					paragraphs: [
						'By accessing and using mdto.page ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These Terms apply to all visitors, users, and others who access or use the Service.',
					],
				},
				{
					heading: "2. Description of Service",
					paragraphs: [
						"mdto.page provides a platform for users to upload, render, and share Markdown files. The Service allows you to convert raw Markdown text into visually rendered web pages that can be shared with others via a unique URL.",
					],
				},
				{
					heading: "3. User Conduct and Content",
					paragraphs: [
						"You are solely responsible for the content you upload and share through the Service. You represent and warrant that you own or have the necessary rights to share any content you upload.",
						"You agree not to use the Service to upload, post, host, or transmit content that:",
					],
					listItems: [
						{
							text: "Is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy.",
						},
						{
							text: "Infringes on any patent, trademark, trade secret, copyright, or other proprietary rights of any party.",
						},
						{
							text: "Contains software viruses or any other computer code designed to interrupt, destroy, or limit the functionality of any computer software or hardware.",
						},
						{
							text: "Is intended to mislead recipients as to the origin of the content.",
						},
					],
					subsections: [
						{
							heading: "",
							paragraphs: [
								"We reserve the right to remove any content that violates these terms or that we find objectionable at our sole discretion.",
							],
						},
					],
				},
				{
					heading: "4. Intellectual Property",
					paragraphs: [
						"We claim no intellectual property rights over the material you provide to the Service. Your profile and materials uploaded remain yours. However, by setting your pages to be viewed publicly (which is the default nature of the Service), you agree to allow others to view your content.",
					],
				},
				{
					heading: "5. Disclaimer of Warranties",
					paragraphs: [
						'The Service is provided on an "AS IS" and "AS AVAILABLE" basis. mdto.page expressly disclaims all warranties of any kind, whether express or implied, including, but not limited to, the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We make no warranty that the Service will meet your requirements, be uninterrupted, timely, secure, or error-free.',
					],
				},
				{
					heading: "6. Limitation of Liability",
					paragraphs: [
						"In no event shall mdto.page, its operators, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.",
					],
				},
				{
					heading: "7. Modifications to Service",
					paragraphs: [
						"We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice at any time. We shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the Service.",
					],
				},
				{
					heading: "8. Governing Law",
					paragraphs: [
						"These Terms shall be governed and construed in accordance with the laws, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.",
					],
				},
				{
					heading: "9. Changes to Terms",
					paragraphs: [
						"We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.",
					],
				},
			],
		},
		"ko-kr": {
			headTitle: "이용약관 – mdto.page",
			metaDescription:
				"mdto.page 마크다운 공유 플랫폼 이용에 관한 이용약관을 확인하세요.",
			pageTitle: "이용약관",
			lastUpdatedLabel: "최종 업데이트:",
			lastUpdatedDate: "2026년 1월 25일",
			sections: [
				{
					heading: "1. 약관 동의",
					paragraphs: [
						'mdto.page("서비스")에 접속하고 사용하는 경우 본 이용약관에 동의한 것으로 간주됩니다. 약관에 동의하지 않는다면 서비스를 이용하지 마세요. 본 약관은 서비스에 접속하거나 이용하는 모든 방문자와 사용자에게 적용됩니다.',
					],
				},
				{
					heading: "2. 서비스 설명",
					paragraphs: [
						"mdto.page는 사용자가 Markdown 파일을 업로드하고, 렌더링하고, 공유할 수 있는 플랫폼을 제공합니다. 이 서비스는 원본 Markdown 텍스트를 시각적으로 렌더링된 웹 페이지로 변환하고 고유 URL로 다른 사람과 공유할 수 있게 합니다.",
					],
				},
				{
					heading: "3. 사용자 행위 및 콘텐츠",
					paragraphs: [
						"서비스를 통해 업로드하고 공유하는 콘텐츠에 대한 책임은 전적으로 사용자에게 있습니다. 사용자는 업로드한 콘텐츠를 공유할 권리를 보유하고 있음을 진술하고 보증합니다.",
						"다음과 같은 콘텐츠를 업로드, 게시, 호스팅 또는 전송하는 데 서비스를 사용하지 않기로 동의합니다:",
					],
					listItems: [
						{
							text: "불법적이거나, 유해하거나, 위협적이거나, 남용적이거나, 괴롭힘을 주거나, 명예를 훼손하거나, 외설적이거나, 타인의 사생활을 침해하는 콘텐츠.",
						},
						{
							text: "특허, 상표, 영업비밀, 저작권 또는 기타 제3자의 권리를 침해하는 콘텐츠.",
						},
						{
							text: "소프트웨어나 하드웨어의 기능을 방해, 파괴 또는 제한하도록 설계된 바이러스나 코드를 포함한 콘텐츠.",
						},
						{
							text: "콘텐츠의 출처에 대해 수신자를 오도할 의도가 있는 콘텐츠.",
						},
					],
					subsections: [
						{
							heading: "",
							paragraphs: [
								"당사는 본 약관을 위반하거나 부적절하다고 판단되는 콘텐츠를 단독 재량으로 제거할 권리를 보유합니다.",
							],
						},
					],
				},
				{
					heading: "4. 지식재산권",
					paragraphs: [
						"서비스에 제공한 자료에 대해 당사가 지식재산권을 주장하지는 않습니다. 프로필과 업로드한 자료의 소유권은 사용자에게 있습니다. 다만 페이지를 공개로 설정하는 경우(서비스의 기본 특성), 다른 사람이 해당 콘텐츠를 볼 수 있도록 허용하는 데 동의하게 됩니다.",
					],
				},
				{
					heading: "5. 보증의 부인",
					paragraphs: [
						'서비스는 "있는 그대로" 그리고 "이용 가능한 상태로" 제공됩니다. mdto.page는 상품성, 특정 목적 적합성, 비침해성을 포함하되 이에 한정되지 않는 모든 명시적 또는 묵시적 보증을 부인합니다. 당사는 서비스가 요구사항을 충족하거나, 중단되지 않거나, 적시에 제공되거나, 안전하거나, 오류가 없음을 보장하지 않습니다.',
					],
				},
				{
					heading: "6. 책임의 제한",
					paragraphs: [
						"어떠한 경우에도 mdto.page, 운영자 또는 그 계열사는 서비스에 대한 접근, 이용 또는 이용 불가로 인해 발생하는 이익 손실, 데이터 손실, 사용 손실, 영업권 손실 및 기타 무형 손실을 포함한 간접적, 부수적, 특별, 결과적, 징벌적 손해에 대해 책임을 지지 않습니다.",
					],
				},
				{
					heading: "7. 서비스 변경",
					paragraphs: [
						"당사는 언제든지 사전 통지 여부와 관계없이 서비스 전체 또는 일부를 일시적 또는 영구적으로 수정하거나 중단할 권리를 보유합니다. 이러한 수정, 중단 또는 종료에 대해 당사는 사용자나 제3자에게 책임을 지지 않습니다.",
					],
				},
				{
					heading: "8. 준거법",
					paragraphs: [
						"본 약관은 법률 충돌 조항과 무관하게 관련 법률에 따라 해석되고 적용됩니다. 당사가 본 약관의 권리나 조항을 집행하지 않더라도 해당 권리를 포기한 것으로 간주되지 않습니다.",
					],
				},
				{
					heading: "9. 약관 변경",
					paragraphs: [
						"당사는 단독 재량으로 언제든지 본 약관을 수정하거나 대체할 권리를 보유합니다. 개정된 약관이 발효된 이후에도 계속 서비스를 이용하면 변경된 약관에 동의한 것으로 간주됩니다.",
					],
				},
			],
		},
		"zh-cn": {
			headTitle: "服务条款 – mdto.page",
			metaDescription:
				"阅读 mdto.page 的服务条款，了解使用本 Markdown 分享平台时适用的规则。",
			pageTitle: "服务条款",
			lastUpdatedLabel: "最后更新：",
			lastUpdatedDate: "2026年1月25日",
			sections: [
				{
					heading: "1. 条款接受",
					paragraphs: [
						"当你访问并使用 mdto.page（以下简称“服务”）时，即表示你同意受本服务条款约束。如果你不同意这些条款，请不要使用本服务。本条款适用于所有访问或使用本服务的访客和用户。",
					],
				},
				{
					heading: "2. 服务说明",
					paragraphs: [
						"mdto.page 提供了一个用于上传、渲染和分享 Markdown 文件的平台。本服务允许你将原始 Markdown 文本转换为可视化网页，并通过唯一 URL 与他人分享。",
					],
				},
				{
					heading: "3. 用户行为与内容",
					paragraphs: [
						"你对通过本服务上传和分享的内容负全部责任。你声明并保证你拥有上传内容的所有权或分享这些内容所需的权利。",
						"你同意不使用本服务上传、发布、托管或传播以下内容：",
					],
					listItems: [
						{
							text: "违法、有害、威胁、辱骂、骚扰、诽谤、粗俗、淫秽或侵犯他人隐私的内容。",
						},
						{
							text: "侵犯任何一方专利、商标、商业秘密、版权或其他专有权利的内容。",
						},
						{
							text: "包含病毒或任何旨在中断、破坏或限制计算机软硬件功能的代码。",
						},
						{
							text: "意图误导接收者对内容来源的判断。",
						},
					],
					subsections: [
						{
							heading: "",
							paragraphs: [
								"对于违反这些条款或我们认为不当的内容，我们保留自行决定删除的权利。",
							],
						},
					],
				},
				{
					heading: "4. 知识产权",
					paragraphs: [
						"我们不主张你提供给本服务材料的知识产权。你的个人资料和上传材料仍归你所有。但当你将页面设置为公开可见时（这是本服务的默认属性），即表示你同意允许他人查看你的内容。",
					],
				},
				{
					heading: "5. 免责声明",
					paragraphs: [
						"本服务按“现状”和“可用性”提供。mdto.page 明确否认任何形式的明示或暗示担保，包括但不限于适销性、特定用途适用性和不侵权担保。我们不保证本服务一定满足你的需求，也不保证其不会中断、及时、安全或无错误。",
					],
				},
				{
					heading: "6. 责任限制",
					paragraphs: [
						"在任何情况下，mdto.page、其运营者或关联方均不对因你访问、使用或无法访问、使用本服务而导致的任何间接、附带、特殊、后果性或惩罚性损害承担责任，包括但不限于利润、数据、使用权、商誉或其他无形损失。",
					],
				},
				{
					heading: "7. 服务变更",
					paragraphs: [
						"我们保留在任何时候、无论是否通知，临时或永久修改或中止本服务（或其中任何部分）的权利。对于任何修改、暂停或终止服务的行为，我们不对你或任何第三方承担责任。",
					],
				},
				{
					heading: "8. 适用法律",
					paragraphs: [
						"本条款应根据相关法律进行解释和适用，而不考虑其法律冲突原则。我们未执行本条款中的任何权利或规定，不应视为对该等权利的放弃。",
					],
				},
				{
					heading: "9. 条款变更",
					paragraphs: [
						"我们保留自行决定随时修改或替换本条款的权利。在修订生效后你继续访问或使用本服务，即表示你接受修订后的条款。",
					],
				},
			],
		},
		"ja-jp": {
			headTitle: "利用規約 – mdto.page",
			metaDescription:
				"mdto.page の Markdown 共有プラットフォームの利用条件について利用規約をご確認ください。",
			pageTitle: "利用規約",
			lastUpdatedLabel: "最終更新:",
			lastUpdatedDate: "2026年1月25日",
			sections: [
				{
					heading: "1. 規約への同意",
					paragraphs: [
						"mdto.page（以下「本サービス」）にアクセスし利用することにより、利用者は本利用規約に拘束されることに同意したものとみなされます。これらの規約に同意しない場合は、本サービスを利用しないでください。本規約は、本サービスにアクセスまたは利用するすべての訪問者、利用者、その他の者に適用されます。",
					],
				},
				{
					heading: "2. サービスの説明",
					paragraphs: [
						"mdto.page は、Markdown ファイルをアップロード、レンダリング、共有するためのプラットフォームを提供します。本サービスでは、生の Markdown テキストを視覚的にレンダリングされたウェブページに変換し、固有の URL を通じて共有できます。",
					],
				},
				{
					heading: "3. 利用者の行為とコンテンツ",
					paragraphs: [
						"本サービスを通じてアップロードまたは共有するコンテンツについては、利用者が単独で責任を負います。利用者は、アップロードしたコンテンツを共有するために必要な権利を有していることを表明し保証するものとします。",
						"利用者は、以下に該当するコンテンツをアップロード、投稿、ホスト、送信するために本サービスを利用しないことに同意します:",
					],
					listItems: [
						{
							text: "違法、有害、脅迫的、虐待的、嫌がらせ、名誉毀損、卑猥、わいせつ、または他者のプライバシーを侵害する内容。",
						},
						{
							text: "特許、商標、営業秘密、著作権、その他第三者の権利を侵害する内容。",
						},
						{
							text: "ソフトウェアやハードウェアの機能を妨害、破壊、制限することを目的としたウイルスやコードを含む内容。",
						},
						{
							text: "コンテンツの出所について受信者を誤認させることを意図した内容。",
						},
					],
					subsections: [
						{
							heading: "",
							paragraphs: [
								"本規約に違反する、または当社が不適切と判断するコンテンツを、当社の単独裁量で削除する権利を留保します。",
							],
						},
					],
				},
				{
					heading: "4. 知的財産",
					paragraphs: [
						"利用者が本サービスに提供した素材について、当社は知的財産権を主張しません。プロフィールおよびアップロードされた素材の権利は利用者に帰属します。ただし、ページを公開表示に設定した場合（これは本サービスの標準的な利用形態です）、他者がそのコンテンツを閲覧することを許可することに同意したものとみなされます。",
					],
				},
				{
					heading: "5. 保証の否認",
					paragraphs: [
						"本サービスは「現状有姿」かつ「提供可能な範囲」で提供されます。mdto.page は、商品性、特定目的適合性、非侵害を含むがこれらに限られない、明示または黙示のあらゆる保証を否認します。本サービスが利用者の要求を満たすこと、中断されないこと、適時であること、安全であること、またはエラーがないことを保証しません。",
					],
				},
				{
					heading: "6. 責任の制限",
					paragraphs: [
						"いかなる場合も、mdto.page、その運営者または関連当事者は、本サービスへのアクセス、利用、または利用不能に起因する間接的、付随的、特別、結果的、懲罰的損害について責任を負いません。これには、利益、データ、使用、信用、その他無形の損失が含まれますが、これらに限定されません。",
					],
				},
				{
					heading: "7. サービスの変更",
					paragraphs: [
						"当社は、本サービスまたはその一部を、通知の有無を問わず、いつでも一時的または恒久的に変更または中止する権利を留保します。そのような変更、停止、終了について、当社は利用者または第三者に対して責任を負いません。",
					],
				},
				{
					heading: "8. 準拠法",
					paragraphs: [
						"本規約は、法の抵触に関する規定にかかわらず、関連法令に従って解釈されます。当社が本規約上の権利または条項を行使しなかった場合でも、その権利を放棄したものとはみなされません。",
					],
				},
				{
					heading: "9. 規約の変更",
					paragraphs: [
						"当社は、独自の裁量により、いつでも本規約を修正または置き換える権利を留保します。改定後も本サービスへのアクセスまたは利用を継続することで、利用者は改定後の規約に拘束されることに同意したものとみなされます。",
					],
				},
			],
		},
	},
};

export function resolveLegalPageLanguage(language?: string): SupportedLanguage {
	return normalizeLanguage(language);
}

export function getLegalPageContent(
	page: LegalPageId,
	language?: string,
): LegalPageContent {
	return legalPageContent[page][resolveLegalPageLanguage(language)];
}
