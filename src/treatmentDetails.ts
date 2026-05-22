export type TreatmentReference = {
  label: string;
  url: string;
};

export type TreatmentDetail = {
  title: string;
  description: string;
  references: TreatmentReference[];
};

export type TreatmentDetailPanel = {
  rawLabel: string;
  details: TreatmentDetail;
  isFamilyFallback?: boolean;
};

export const TREATMENT_DETAILS_BY_RAW_LABEL: Record<string, TreatmentDetail> = {
  "Acceptance and commitment therapy": {
    title: "Acceptance and commitment therapy",
    description:
      "Acceptance and commitment therapy (ACT) is a behavioral treatment that aims to increase psychological flexibility rather than eliminate difficult thoughts outright. In depression care, it typically combines acceptance, mindfulness, values clarification, and committed action. Rather than trying to 'win' an argument with every negative thought, ACT helps people notice thoughts, make room for difficult feelings, and keep moving toward actions that matter. Recent reviews report small-to-moderate improvements in depressive symptoms across studies, and ACT is commonly grouped with third-wave cognitive therapies.",
    references: [
      { label: "[Evidence] ACT overview review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10293686/" },
      { label: "[Evidence] ACT recent review", url: "https://pubmed.ncbi.nlm.nih.gov/40738527/" },
      { label: "[Evidence] Internet ACT review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9789494/" },
    ],
  },
  "Acupuncture and counselling": {
    title: "Acupuncture and counselling",
    description:
      "Acupuncture and counselling are usually offered as adjunctive or alternative approaches, not replacements for evidence-based depression care when symptoms are severe. A systematic review found acupuncture may help some people with major depressive disorder, but the evidence base is more heterogeneous than for mainstream psychotherapies, so it is best discussed alongside standard care. Counselling, meanwhile, gives space for emotional exploration and support, which some people find especially helpful when life stress and relationship strain are central.",
    references: [
      { label: "[Evidence] Acupuncture meta-analysis", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6722678/" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Alleviating distressing intrusive memories": {
    title: "Alleviating distressing intrusive memories",
    description:
      "This is best understood as an emerging, targeted intervention rather than a mainstream standalone depression therapy. Early research has tested cognitive bias modification and brief CBT-style psychoeducation to reduce distress linked to intrusive autobiographical memories in depression, but the treatment area is still underdeveloped. In practice, it is more accurate to describe this as a focused symptom intervention that may be useful for some people whose depression is strongly tied to recurring distressing memories.",
    references: [
      { label: "[Evidence] Intrusive memories paper", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4007010/" },
      { label: "[Evidence] Imagery-focused related research", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5969465/" },
    ],
  },
  "Antenatal cognitive behavioral therapy": {
    title: "Antenatal cognitive behavioral therapy",
    description:
      "Antenatal cognitive behavioral therapy is CBT adapted for pregnancy, with the same core focus on links between thoughts, feelings, and behavior but tailored to pregnancy-related stressors, mood symptoms, and relapse prevention. It is used because depression during pregnancy can affect both maternal functioning and later postpartum risk, and perinatal programs often adapt CBT content rather than inventing a wholly different therapy. In practice, the work may include mood monitoring, cognitive restructuring, behavioral activation, and planning for the transition into the postpartum period.",
    references: [
      { label: "[Learn more] NHS CBT overview", url: "https://www.nhs.uk/tests-and-treatments/cognitive-behavioural-therapy-cbt/" },
      { label: "[Program] Mothers and Babies program", url: "https://www.mothersandbabiesprogram.org/" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Behavioral activation": {
    title: "Behavioral activation",
    description:
      "Behavioral activation is a structured depression treatment that helps people increase contact with meaningful, rewarding, or necessary activities while reducing patterns of avoidance. Reviews describe it as a standalone, evidence-based psychotherapy for depression with efficacy that is broadly comparable to traditional CBT in many settings. The treatment is often simple in concept but powerful in practice: depression narrows life, and BA works by gradually reopening it through action.",
    references: [
      { label: "[Evidence] Behavioral activation review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9082162/" },
      { label: "[Guideline] APA decision aid", url: "https://www.apa.org/depression-guideline/decision-aid-adults.pdf" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Behavioral activation therapy": {
    title: "Behavioral activation therapy",
    description:
      "Behavioral activation therapy is the more formal, therapist-delivered version of behavioral activation. The approach focuses on monitoring mood and activity, identifying avoidance, and rebuilding routines and values-based activity. Both APA and NICE include behavioral approaches among evidence-based options for depression, and in clinical settings BA is often chosen when a person is stuck in withdrawal, reduced routine, and low motivation.",
    references: [
      { label: "[Evidence] Behavioral activation review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9082162/" },
      { label: "[Guideline] APA decision aid", url: "https://www.apa.org/depression-guideline/decision-aid-adults.pdf" },
      { label: "[Guideline] NICE rationale and impact", url: "https://www.nice.org.uk/guidance/ng222/chapter/rationale-and-impact" },
    ],
  },
  "Behavioral treatment": {
    title: "Behavioral treatment",
    description:
      "Behavioral treatment is a broad family term covering approaches that change behavior patterns linked to depression, especially withdrawal, inactivity, and avoidance. In current depression guidance, this family is usually operationalized through behavioral activation or related structured behavioral therapies rather than left generic. It is therefore better understood as a category label than as one specific manualized treatment.",
    references: [
      { label: "[Guideline] APA decision aid", url: "https://www.apa.org/depression-guideline/decision-aid-adults.pdf" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  Bibliotherapy: {
    title: "Bibliotherapy",
    description:
      "Bibliotherapy uses structured therapeutic reading materials, often CBT-based workbooks or manuals, to help people learn and practice skills between or instead of sessions. NICE treats self-help and guided self-help as valid first-line options for less severe depression, especially when materials are evidence-based and supported appropriately. The quality of the materials matters a great deal; bibliotherapy works best when the content is structured, evidence-based, and clearly linked to therapeutic techniques.",
    references: [
      {
        label: "[Guideline] NICE first-line treatments for less severe depression",
        url: "https://www.nice.org.uk/guidance/ng222/resources/discussingfirstline-treatments-for-less-severe-depression-pdf-11131007006",
      },
      { label: "[Program] Centre for Clinical Interventions self-help resources", url: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself" },
    ],
  },
  "Brief culturally adapted cbt": {
    title: "Brief culturally adapted CBT",
    description:
      "Brief culturally adapted CBT keeps core CBT methods but adjusts language, examples, explanatory models, and delivery so treatment fits the person's cultural context. In practice, it is still CBT, but adaptation can improve acceptability, engagement, and relevance for populations who might not respond as well to a one-size-fits-all format. The 'brief' element usually means a shorter or lower-intensity structure, not a different theoretical model.",
    references: [
      { label: "[Learn more] NHS CBT overview", url: "https://www.nhs.uk/tests-and-treatments/cognitive-behavioural-therapy-cbt/" },
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
    ],
  },
  "Cognitive behavior therapy": {
    title: "Cognitive behavior therapy",
    description:
      "Cognitive behavior therapy helps people identify patterns of negative thinking and behavior that maintain depression and then test more helpful alternatives in daily life. APA recommends CBT for adult depression, and the NHS describes it as a talking therapy that helps people change how they think and act. For many people, CBT is attractive because it is structured, practical, and skill-based rather than purely exploratory.\n\nMind's public first-person stories help illustrate that experience. In 'CBT and me,' Sophie writes that 'talking therapies like CBT and counselling can be really effective for depression and anxiety,' while also describing the importance of getting the right level of support for her situation. In 'How CBT helped me find happiness,' another writer says CBT helped them 'see what was really going on and where the root of the problem is,' framing the therapy as a way to understand and change patterns rather than simply suppress feelings.",
    references: [
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
      { label: "[Learn more] NHS CBT overview", url: "https://www.nhs.uk/tests-and-treatments/cognitive-behavioural-therapy-cbt/" },
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
      { label: "[Patient story] Mind, 'CBT and me'", url: "https://www.mind.org.uk/information-support/your-stories/cbt-and-me/" },
      { label: "[Patient story] Mind, 'How CBT helped me find happiness'", url: "https://www.mind.org.uk/information-support/your-stories/how-cbt-helped-me-find-happiness/" },
    ],
  },
  "Cognitive therapy": {
    title: "Cognitive therapy",
    description:
      "Cognitive therapy is the cognitive precursor of modern CBT and focuses especially on identifying distorted or overly negative thinking styles linked to depression. APA includes cognitive therapy among recommended psychotherapies for adult depression. Compared with broader CBT, cognitive therapy places even more emphasis on evaluating beliefs, assumptions, and automatic thoughts that color mood and interpretation.",
    references: [
      { label: "[Guideline] APA decision aid", url: "https://www.apa.org/depression-guideline/decision-aid-adults.pdf" },
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
    ],
  },
  "Compassion-based intervention": {
    title: "Compassion-based intervention",
    description:
      "Compassion-based interventions aim to reduce harsh self-criticism and shame while building a kinder, more balanced response to distress. In depression, that can matter because self-criticism and rumination often amplify low mood and hopelessness. These methods are commonly grouped with third-wave approaches and are especially relevant when depression is marked by chronic self-attack rather than only sadness.",
    references: [
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
      { label: "[Evidence] MBCT and related review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4876939/" },
    ],
  },
  "Comprehensive self-control training": {
    title: "Comprehensive self-control training",
    description:
      "Comprehensive self-control training refers to structured skills work designed to improve regulation of thoughts, emotions, and behavior. For depression, it is better viewed as a skills-based adjunct or protocol element than as a front-line guideline category on its own. It overlaps with broader self-management work used across CBT-family interventions, especially when treatment emphasizes monitoring, routine, and deliberate reinforcement.",
    references: [
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Computer-assisted cognitive therapy": {
    title: "Computer-assisted cognitive therapy",
    description:
      "Computer-assisted cognitive therapy delivers cognitive therapy content through software, digital modules, or blended clinician-plus-program formats. The goal is still standard cognitive therapy for depression, but technology can increase access and standardize some parts of treatment. It is best understood as a delivery format for a cognitive therapy model rather than a fundamentally different psychotherapy.",
    references: [
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Coping effectiveness training": {
    title: "Coping effectiveness training",
    description:
      "Coping effectiveness training teaches people how to evaluate stressors and choose coping strategies that are proportionate and useful rather than automatic or avoidant. In depression care, it is generally used as a structured skills intervention or adjunct rather than as a major standalone guideline category. It is particularly relevant when depression sits alongside chronic stress, illness, or major life burden.",
    references: [
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  Counselling: {
    title: "Counselling",
    description:
      "Counselling for depression usually focuses on emotional processing, problem discussion, and supportive reflection rather than the more manualized exercises used in CBT. NICE still includes counselling as a treatment option in some contexts, but modern guidelines often emphasize matching it to severity and patient preference. Counselling may be especially valued by people who want a space to talk through life events, grief, or relationship strain without a highly structured format.\n\nThat lived experience appears in public stories too. In Mind's 'Opening up about depression,' the writer explains that talking therapy helped them identify triggers for their illness and encouraged others with depression to seek counselling or talking therapy if they are struggling. That kind of account fits with counselling's core appeal: feeling heard, understood, and able to make sense of what is happening.",
    references: [
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
      { label: "[Patient story] Mind, 'Opening up about depression'", url: "https://www.mind.org.uk/information-support/your-stories/opening-up-about-depression/" },
    ],
  },
  "Digital behavioral activation intervention": {
    title: "Digital behavioral activation intervention",
    description:
      "A digital behavioral activation intervention translates the core steps of behavioral activation into an app, web program, or blended digital format. The logic is the same as therapist-led BA - reducing avoidance and increasing meaningful activity - but digital delivery aims to improve reach and convenience. These interventions can be especially useful in stepped-care systems or where face-to-face access is limited.",
    references: [
      { label: "[Evidence] Behavioral activation review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9082162/" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Gestalt therapy": {
    title: "Gestalt therapy",
    description:
      "Gestalt therapy is a humanistic approach that emphasizes present-moment awareness, emotional experience, and how people make meaning in relationships and situations. It is used in depression care in some settings, but it is not as strongly featured in modern depression guidelines as CBT, IPT, behavioral activation, or psychodynamic therapy. It is therefore better viewed as a recognized therapeutic tradition with more limited depression-specific guideline prominence.",
    references: [
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Group cognitive behavioural therapy": {
    title: "Group cognitive behavioral therapy",
    description:
      "Group CBT delivers standard CBT skills in a group format, which can reduce cost and expand access while still teaching cognitive restructuring, behavioral experiments, and relapse prevention. NICE reports good evidence for the effectiveness of group CBT and notes it is likely to be cost effective for less severe depression on average. Beyond cost, the group format can also reduce isolation by showing participants they are not alone in the patterns they struggle with.",
    references: [
      { label: "[Guideline] NICE rationale and impact", url: "https://www.nice.org.uk/guidance/ng222/chapter/rationale-and-impact" },
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
    ],
  },
  "Group interpersonal psychotherapy": {
    title: "Group interpersonal psychotherapy",
    description:
      "Group interpersonal psychotherapy applies IPT principles in a group setting, focusing on links between mood and current interpersonal difficulties such as grief, role transitions, disputes, and isolation. The evidence base for IPT is well established overall, while group delivery is best seen as a format adaptation of the same model. For some patients, the group itself becomes part of the interpersonal learning process.",
    references: [
      { label: "[Learn more] International Society of Interpersonal Psychotherapy", url: "https://interpersonalpsychotherapy.org/" },
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
    ],
  },
  "Group person-based cognitive therapy": {
    title: "Group person-based cognitive therapy",
    description:
      "Group person-based cognitive therapy is a group adaptation of person-based cognitive therapy developed for chronic depression and related difficulties. The published pilot trial suggests promise, but it remains a niche intervention compared with standard CBT or MBCT. It is most useful to describe it as a specialized group adaptation rather than a mainstream first-line treatment.",
    references: [
      { label: "[Evidence] Pilot trial summary from University of Bath research portal", url: "https://researchportal.bath.ac.uk/en/publications/group-person-based-cognitive-therapy-for-chronic-depression-a-pil/" },
    ],
  },
  "Guided self-help": {
    title: "Guided self-help",
    description:
      "Guided self-help uses structured written or digital materials with brief support from a clinician, coach, or service. NICE specifically lists guided self-help among first-line options for less severe depression because it is less intrusive and less resource intensive than full therapy. The support element matters: the 'guided' part often improves uptake and completion compared with unsupported self-help.",
    references: [
      {
        label: "[Guideline] NICE first-line treatments for less severe depression",
        url: "https://www.nice.org.uk/guidance/ng222/resources/discussingfirstline-treatments-for-less-severe-depression-pdf-11131007006",
      },
      { label: "[Program] Centre for Clinical Interventions self-help resources", url: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself" },
    ],
  },
  "Integrative cognitive therapy": {
    title: "Integrative cognitive therapy",
    description:
      "Integrative cognitive therapy combines core cognitive methods with other evidence-based techniques while preserving the central idea that thinking patterns influence mood and behavior. In depression, it is best understood as a CBT-family adaptation rather than a wholly separate evidence base. The 'integrative' label usually signals flexibility in delivery rather than a completely distinct theory of change.",
    references: [
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
    ],
  },
  "Internet-based behavioral activation": {
    title: "Internet-based behavioral activation",
    description:
      "Internet-based behavioral activation delivers BA through web modules, app-based prompts, or digital coaching. It keeps BA's central focus on activity scheduling and reducing avoidance, but uses remote delivery to widen access and lower treatment burden. It is usually best understood as BA delivered in a digital format, not a separate theoretical model.",
    references: [
      { label: "[Evidence] Behavioral activation review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9082162/" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Internet-based cognitive behavior therapy": {
    title: "Internet-based cognitive behavior therapy",
    description:
      "Internet-based cognitive behavior therapy delivers structured CBT online, often with therapist guidance, asynchronous messaging, or digital exercises. Research and service models show it can reduce depressive symptoms, and it is often used to expand access where face-to-face treatment is limited. The strength of the approach depends less on the internet delivery itself than on whether the underlying CBT program is evidence-based and properly supported.",
    references: [
      { label: "[Service model] NHS Talking Therapies manual", url: "https://www.england.nhs.uk/wp-content/uploads/2018/06/nhs-talking-therapies-manual-v7.1-updated.pdf" },
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
      { label: "[Evidence] Internet ACT review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9789494/" },
    ],
  },
  "Internet-based problem-solving training": {
    title: "Internet-based problem-solving training",
    description:
      "Internet-based problem-solving training teaches a structured method for defining problems, generating options, choosing actions, and reviewing outcomes, but through a digital platform. It is especially relevant for less severe depression or stepped-care services where low-intensity treatments are appropriate. It belongs to the same family as problem-solving therapy, with the main difference being delivery format and intensity.",
    references: [
      { label: "[Program] Centre for Clinical Interventions self-help resources", url: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself" },
      {
        label: "[Guideline] NICE first-line treatments for less severe depression",
        url: "https://www.nice.org.uk/guidance/ng222/resources/discussingfirstline-treatments-for-less-severe-depression-pdf-11131007006",
      },
    ],
  },
  "Internet-based treatment": {
    title: "Internet-based treatment",
    description:
      "Internet-based treatment is an umbrella term for structured psychological interventions delivered online, including CBT, behavioral activation, and problem-solving approaches. Its advantages are accessibility and scalability, but quality depends on whether the program is evidence-based and appropriately supported. It is best treated as a delivery umbrella rather than one specific psychotherapy.",
    references: [
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
      { label: "[Service model] NHS Talking Therapies manual", url: "https://www.england.nhs.uk/wp-content/uploads/2018/06/nhs-talking-therapies-manual-v7.1-updated.pdf" },
    ],
  },
  "Interpersonal counseling": {
    title: "Interpersonal counseling",
    description:
      "Interpersonal counseling is a briefer, lower-intensity adaptation of interpersonal psychotherapy. It uses the same logic - linking symptoms to current relationship or role problems - but is typically more limited in scope and duration. It is often especially useful in primary care or stepped-care contexts where full IPT may not be available.",
    references: [
      { label: "[Learn more] International Society of Interpersonal Psychotherapy", url: "https://interpersonalpsychotherapy.org/" },
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
    ],
  },
  "Interpersonal psychotherapy": {
    title: "Interpersonal psychotherapy",
    description:
      "Interpersonal psychotherapy is an evidence-based depression treatment that focuses on the relationship between mood and current interpersonal stressors such as grief, conflict, role changes, and social isolation. APA recommends IPT for adult depression, and the model has a strong research tradition in depressive disorders. Unlike therapies that focus primarily on thought content, IPT assumes that improving current relationships and social functioning can reduce depressive symptoms.",
    references: [
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
      { label: "[Learn more] International Society of Interpersonal Psychotherapy", url: "https://interpersonalpsychotherapy.org/" },
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
    ],
  },
  "Interpersonal therapy": {
    title: "Interpersonal therapy",
    description:
      "Interpersonal therapy is the broader label often used for IPT-style treatment of depression. It aims to improve depressive symptoms by addressing current relational patterns and social context rather than only internal thoughts or behaviors. In practice, most formal depression work under this label maps back to the IPT model and its variants.",
    references: [
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
      { label: "[Learn more] International Society of Interpersonal Psychotherapy", url: "https://interpersonalpsychotherapy.org/" },
    ],
  },
  "Life review therapy": {
    title: "Life review therapy",
    description:
      "Life review therapy is commonly used with older adults and involves structured reflection on life events to promote meaning, coherence, and emotional processing. It can be helpful for depressive symptoms in later life, but it is less central in mainstream adult depression guidelines than CBT, IPT, or BA. It is particularly relevant in settings where depression is tied to aging, loss, and identity across the lifespan.",
    references: [
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
      { label: "[Evidence] Mindfulness and depression in older adults meta-analysis", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11114204/" },
    ],
  },
  "Metacognitive therapy": {
    title: "Metacognitive therapy",
    description:
      "Metacognitive therapy targets the processes that keep depression going, especially rumination and unhelpful beliefs about thinking itself. Reviews and clinical studies suggest it is promising for depression, with work showing reductions in symptoms and improvements that may persist over follow-up. The key difference from standard cognitive therapy is that the target is not mainly the content of thoughts, but the habits and beliefs that keep a person locked in repetitive thinking.",
    references: [
      { label: "[Evidence] Metacognitive therapy review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12443011/" },
      { label: "[Evidence] Metacognitive therapy trial", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5258745/" },
      { label: "[Evidence] Metacognitive therapy follow-up", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6936246/" },
    ],
  },
  "Metacognitive training": {
    title: "Metacognitive training",
    description:
      "Metacognitive training is closely related to metacognitive therapy but is often more psychoeducational and skills-focused. In depression, it aims to help people recognize and disengage from unhelpful styles of thinking, though the better-established evidence base is for full metacognitive therapy. It is best described as a related intervention family rather than a stronger evidence base than MCT itself.",
    references: [
      { label: "[Evidence] Metacognitive therapy review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12443011/" },
      { label: "[Evidence] Metacognitive therapy trial", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5258745/" },
    ],
  },
  "Mindfulness-based intervention": {
    title: "Mindfulness-based intervention",
    description:
      "Mindfulness-based interventions teach sustained, nonjudgmental awareness of thoughts, feelings, and bodily sensations. In depression care, they are often used to reduce relapse risk or soften repetitive negative thinking, especially when delivered in structured programs such as mindfulness-based cognitive therapy. The broader 'intervention' label covers a range of mindfulness-based formats, not all of them equally intensive.\n\nNHS public guidance captures the core experience in plain language: mindfulness can help people 'step back' from difficult thoughts instead of becoming swept away by them. That fits closely with how these interventions are often described clinically - as training in observation, not suppression.",
    references: [
      { label: "[Evidence] MBCT review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4876939/" },
      { label: "[Evidence] MBCT routine outcomes", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7745235/" },
      { label: "[Evidence] Mindfulness in older adults meta-analysis", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11114204/" },
      { label: "[Patient-facing resource] NHS Every Mind Matters on mindfulness", url: "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/mindfulness/" },
    ],
  },
  "Mindfulness-based therapy": {
    title: "Mindfulness-based therapy",
    description:
      "Mindfulness-based therapy for depression usually refers to structured programs that combine meditation practice with psychological skills, often in the MBCT tradition. Evidence is strongest for relapse prevention and symptom reduction in some groups, rather than as a universal replacement for all other therapies. Compared with a generic mindfulness intervention, the 'therapy' label usually implies a more manualized clinical format.",
    references: [
      { label: "[Evidence] MBCT review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4876939/" },
      { label: "[Evidence] MBCT routine outcomes", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7745235/" },
    ],
  },
  "Morita therapy": {
    title: "Morita therapy",
    description:
      "Morita therapy is a Japanese psychotherapy that emphasizes accepting feelings as they are and refocusing on purposeful action rather than controlling symptoms directly. Reviews suggest it may be promising for depression, but the evidence base is still much smaller than for CBT or IPT. Conceptually, it has some overlap with ACT in valuing action despite difficult internal experience.",
    references: [
      { label: "[Evidence] Morita therapy meta-analysis", url: "https://pubmed.ncbi.nlm.nih.gov/30380592/" },
      { label: "[Evidence] Morita therapy trial", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6089263/" },
    ],
  },
  "Mothers and babies course": {
    title: "Mothers and babies course",
    description:
      "The Mothers and Babies course is an evidence-based program for pregnant people and new parents designed to help manage stress and prevent postpartum depression. Program materials describe it as drawing on cognitive behavioral therapy and attachment theory, with practical skills for mood, behavior, and connection. It is better understood as a prevention and early intervention program than a generic psychotherapy label.",
    references: [
      { label: "[Program] Mothers and Babies program", url: "https://www.mothersandbabiesprogram.org/" },
      { label: "[Program] Mothers and Babies training", url: "https://institutefsp.org/modules/the-mothers-and-babies-course-introduction-training" },
    ],
  },
  "Motivational interviewing": {
    title: "Motivational interviewing",
    description:
      "Motivational interviewing is a collaborative method for strengthening a person's own motivation for change. In depression care it is more often used to improve engagement, readiness, and adherence - especially when depression coexists with other behavior-change problems - than as a sole depression treatment. Its tone is evocative and non-confrontational, helping people work through ambivalence rather than being pushed into change.",
    references: [
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Nondirective supportive therapy": {
    title: "Nondirective supportive therapy",
    description:
      "Nondirective supportive therapy emphasizes empathy, listening, validation, and a strong therapeutic relationship rather than structured homework or cognitive techniques. APA includes supportive therapy among recommended psychotherapies for depression, although it is usually less manualized than CBT or IPT. For some patients, the absence of a heavy technique burden is precisely what makes it tolerable and useful.",
    references: [
      { label: "[Guideline] APA decision aid", url: "https://www.apa.org/depression-guideline/decision-aid-adults.pdf" },
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
    ],
  },
  "Online therapy": {
    title: "Online therapy",
    description:
      "Online therapy means the therapeutic contact itself is delivered digitally, such as by video, secure messaging, or a structured platform. It can widen access to depression treatment, but the key issue is still whether the underlying therapy is evidence-based and delivered safely. Online therapy is therefore best treated as a delivery format that can host many different therapy models, not as one model itself.",
    references: [
      { label: "[Service model] NHS Talking Therapies manual", url: "https://www.england.nhs.uk/wp-content/uploads/2018/06/nhs-talking-therapies-manual-v7.1-updated.pdf" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Peer-delivered cognitive behavioral therapy": {
    title: "Peer-delivered cognitive behavioral therapy",
    description:
      "Peer-delivered CBT keeps core CBT methods but some support is provided by trained peers rather than only by traditionally credentialed therapists. This can improve reach and acceptability in some settings, but evidence and implementation quality vary by program. It is most relevant where access is limited or where peer support improves engagement.",
    references: [
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Perinatal dyadic psychotherapy": {
    title: "Perinatal dyadic psychotherapy",
    description:
      "Perinatal dyadic psychotherapy is a mother-infant intervention developed to reduce postpartum depressive symptoms while also supporting the early relationship between mother and baby. A pilot randomized trial described it as a dual-focused intervention intended to reduce maternal symptoms and improve aspects of the mother-infant relationship. This distinguishes it from individual postpartum therapy that focuses only on the mother.",
    references: [
      { label: "[Evidence] Perinatal dyadic psychotherapy trial", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4439372/" },
      { label: "[Learn more] MGH summary of perinatal dyadic psychotherapy", url: "https://womensmentalhealth.org/posts/perinatal-dyadic-psychotherapy-treatment-postpartum-depression/" },
    ],
  },
  "Problem-solving therapy": {
    title: "Problem-solving therapy",
    description:
      "Problem-solving therapy teaches people to break overwhelming difficulties into concrete, manageable problems and then work through possible solutions systematically. It is a long-standing evidence-based approach for depression and is commonly used in stepped care and primary care contexts. It is particularly useful when low mood is tightly bound up with practical life stress and a sense of being stuck.",
    references: [
      { label: "[Program] Centre for Clinical Interventions self-help resources", url: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself" },
      {
        label: "[Guideline] NICE first-line treatments for less severe depression",
        url: "https://www.nice.org.uk/guidance/ng222/resources/discussingfirstline-treatments-for-less-severe-depression-pdf-11131007006",
      },
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
    ],
  },
  "Psychodynamic psychotherapy": {
    title: "Psychodynamic psychotherapy",
    description:
      "Psychodynamic psychotherapy explores recurring emotional patterns, relationships, conflicts, and expectations that may contribute to depression. Modern reviews conclude that psychodynamic therapy for depression has a meaningful evidence base, and APA includes it among recommended options. Compared with more skills-focused approaches, it typically gives more attention to emotional meaning and recurring relational patterns across time.",
    references: [
      { label: "[Evidence] Psychodynamic therapy review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8647477/" },
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
    ],
  },
  "Psychodynamic therapy": {
    title: "Psychodynamic therapy",
    description:
      "Psychodynamic therapy is the broader family term for psychodynamic psychotherapy approaches used to treat depression. It focuses less on symptom drills and more on emotional meaning, relationship patterns, and unconscious or habitual ways of experiencing self and others. In modern depression care, it is one of several psychotherapy options with meaningful evidence rather than a fringe approach.",
    references: [
      { label: "[Evidence] Psychodynamic therapy review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8647477/" },
      { label: "[Guideline] APA decision aid", url: "https://www.apa.org/depression-guideline/decision-aid-adults.pdf" },
    ],
  },
  Psychotherapy: {
    title: "Psychotherapy",
    description:
      "Psychotherapy is the umbrella term for structured talk-based treatment delivered by a trained professional. For depression, reliable guidelines emphasize that several psychotherapies - not just one - have evidence, including CBT, IPT, psychodynamic therapy, behavioral therapy, mindfulness-based cognitive therapy, and supportive therapy. The right match often depends on severity, access, history, and patient preference.",
    references: [
      { label: "[Guideline] APA guideline for adults with depression", url: "https://www.apa.org/depression-guideline/adults/" },
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
    ],
  },
  "Social problem-solving therapy": {
    title: "Social problem-solving therapy",
    description:
      "Social problem-solving therapy is a variant of problem-solving treatment that gives extra emphasis to how people interpret and manage real-world interpersonal and practical problems. For depression, it is best understood as a specialized form of problem-solving therapy rather than a wholly separate guideline category. The emphasis is not just on solving tasks, but on approaching social difficulties with greater flexibility and realism.",
    references: [
      { label: "[Program] Centre for Clinical Interventions self-help resources", url: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself" },
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
    ],
  },
  "Task-shifting interpersonal counseling": {
    title: "Task-shifting interpersonal counseling",
    description:
      "Task-shifting interpersonal counseling adapts interpersonal methods so trained non-specialists can deliver lower-intensity care under supervision. This is particularly relevant in settings with few specialist clinicians, where depression services need scalable models without abandoning evidence-based principles. It is more a service-delivery strategy than a separate psychotherapy theory.",
    references: [
      { label: "[Learn more] International Society of Interpersonal Psychotherapy", url: "https://interpersonalpsychotherapy.org/" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Telephone-based psychotherapy": {
    title: "Telephone-based psychotherapy",
    description:
      "Telephone-based psychotherapy delivers structured therapy sessions by phone instead of in person. It is mainly a delivery format rather than a separate therapy model, and it can improve access for people who face transport, childcare, disability, or geographic barriers. As with online therapy, what matters most clinically is the underlying therapy model and the quality of delivery.",
    references: [
      { label: "[Service model] NHS Talking Therapies manual", url: "https://www.england.nhs.uk/wp-content/uploads/2018/06/nhs-talking-therapies-manual-v7.1-updated.pdf" },
      { label: "[Guideline] NICE depression recommendations", url: "https://www.nice.org.uk/guidance/ng222/chapter/Recommendations" },
    ],
  },
  "Third-wave cognitive therapies": {
    title: "Third-wave cognitive therapies",
    description:
      "Third-wave cognitive therapies are a broad group of approaches, including ACT and mindfulness-based therapies, that focus less on disputing the literal content of thoughts and more on changing the person's relationship to thoughts and emotions. In depression, they are often used to reduce rumination, self-criticism, and avoidance while building psychological flexibility. They are best seen as a family of related models rather than one single manual.",
    references: [
      { label: "[Evidence] ACT overview review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10293686/" },
      { label: "[Evidence] MBCT review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4876939/" },
      { label: "[Learn more] APA on recovering from depression", url: "https://www.apa.org/topics/depression/recover" },
    ],
  },
};

export const DISPLAY_GROUP_PRIMARY_RAW_LABEL: Record<string, string> = {
  act: "Acceptance and commitment therapy",
  behavioral_activation: "Behavioral activation",
  cbt: "Cognitive behavior therapy",
  ipt: "Interpersonal psychotherapy",
  life_review: "Life review therapy",
  mindfulness_relapse_focused: "Mindfulness-based therapy",
  problem_solving: "Problem-solving therapy",
  psychodynamic: "Psychodynamic psychotherapy",
  psychoeducational_guided_self_help: "Guided self-help",
  supportive_therapy: "Nondirective supportive therapy",
  other_third_wave: "Third-wave cognitive therapies",
};

export const DISPLAY_GROUP_FAMILY_FALLBACK: Record<
  string,
  {
    familyTitle: string;
    sourceRawLabel: string;
    intro: string;
  }
> = {
  cbt_health_tailored: {
    familyTitle: "Cognitive Behavioral Therapy (CBT) family of treatments",
    sourceRawLabel: "Cognitive behavior therapy",
    intro:
      "We do not have a description for this exact type of health-tailored CBT in the provided files. The information below describes the broader CBT family that this treatment belongs to.",
  },
};
