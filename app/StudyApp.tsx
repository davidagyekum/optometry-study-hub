'use client';

import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from 'react';

type Figure = { src: string; width: number; height: number; alt: string; caption: string; credit: string; sourceUrl?: string };
type CoverImage = { src: string; width: number; height: number };
type Section = { id: string; title: string; summary: string; bullets: string[]; terms: string[]; clinical: string; image: Figure };
type Fact = { q: string; a: string; section: string };
type Module = { id: string; number: string; title: string; shortTitle: string; description: string; tone: string; coverImage: CoverImage; objectives: string[]; sections: Section[]; facts: Fact[] };
type Question = { id: string; prompt: string; options: string[]; correct: string; explanation: string; sectionId: string };
type Attempt = { id: string; moduleId: string; startedAt: string; order: string[]; optionOrder: Record<string, string[]>; answers: Record<string, string>; flags: string[]; current: number };
type Result = Attempt & { submittedAt: string; score: number; total: number };
type Store = { version: 1; read: Record<string, string[]>; active: Record<string, Attempt | undefined>; results: Record<string, Result[]> };

const STORAGE_KEY = 'opt376-study-state:v1';
const EMPTY_STORE: Store = { version: 1, read: {}, active: {}, results: {} };

const COURSE_CREDIT = 'Supplied OPT 376 lecture deck';
const NEI_EYE_URL = 'https://www.nei.nih.gov/eye-health-information/healthy-vision/nei-for-kids/about-eye';
const OPENSTAX_EYE_URL = 'https://openstax.org/books/biology-2e/pages/36-5-vision';

const sectionImages: Record<string, Figure> = {
  landmarks: { src: '/images/modules/ocular/01-landmarks.webp', width: 1600, height: 601, alt: 'Labelled front and side views of the eyelids showing the palpebral aperture, canthi, puncta, limbus and upper and lower lids.', caption: 'External eyelid landmarks and palpebral topography.', credit: COURSE_CREDIT },
  muscles: { src: '/images/modules/ocular/02-eyelid-layers.webp', width: 625, height: 614, alt: 'Histological cross-section of an eyelid labelled with skin, orbicularis oculi, hair follicle, meibomian glands, conjunctiva and cornea.', caption: 'Cross-section showing the principal layers of the eyelid.', credit: COURSE_CREDIT },
  'tarsus-glands': { src: '/images/modules/ocular/03-tarsus-conjunctiva.webp', width: 356, height: 245, alt: 'Diagram of upper and lower tarsal plates showing rows of meibomian glands, their duct openings, puncta and palpebral conjunctiva.', caption: 'Meibomian glands within the upper and lower tarsal plates.', credit: COURSE_CREDIT },
  'lower-lid-blood': { src: '/images/modules/ocular/04-eyelid-blood-supply.webp', width: 1024, height: 546, alt: 'Diagram of ophthalmic and facial venous connections around the orbit, including the superior and inferior ophthalmic veins, lacrimal vein and vortex veins.', caption: 'Orbital venous connections relevant to the lids and conjunctiva.', credit: COURSE_CREDIT },
  'lacrimal-gland': { src: '/images/modules/ocular/05-lacrimal-gland.webp', width: 930, height: 889, alt: 'Anatomical illustration locating the lacrimal gland in the superolateral orbit above the outer part of the upper eyelid.', caption: 'Position of the lacrimal gland in the superolateral orbit.', credit: COURSE_CREDIT },
  tears: { src: '/images/modules/ocular/06-tear-film-drainage.webp', width: 388, height: 254, alt: 'Tear drainage diagram tracing tears from the lacrimal gland across the eye into the puncta, canaliculi, lacrimal sac and nasolacrimal duct.', caption: 'Tear drainage from the lacrimal gland to the nasal cavity.', credit: COURSE_CREDIT },
  'media-chambers': { src: '/images/modules/aqueous/01-media-chambers.webp', width: 1043, height: 577, alt: 'OpenStax cross-section of the human eye labelling the aqueous humour at the front and vitreous humour in the large posterior cavity.', caption: 'The transparent media and their positions within the globe.', credit: 'OpenStax Biology 2e · CC BY-NC-SA', sourceUrl: OPENSTAX_EYE_URL },
  production: { src: '/images/modules/aqueous/02-aqueous-production.webp', width: 833, height: 1200, alt: 'National Eye Institute eye cross-section focused on the cornea, iris, pupil and lens of the anterior segment.', caption: 'Anterior-segment relationships around the site of aqueous production.', credit: 'National Eye Institute', sourceUrl: NEI_EYE_URL },
  flow: { src: '/images/modules/aqueous/03-aqueous-flow.webp', width: 458, height: 577, alt: 'OpenStax anterior eye cross-section showing the cornea, iris, pupil, lens and aqueous humour between the cornea and iris.', caption: 'Aqueous passes from the posterior chamber through the pupil into the anterior chamber.', credit: 'OpenStax Biology 2e · CC BY-NC-SA', sourceUrl: OPENSTAX_EYE_URL },
  iop: { src: '/images/modules/aqueous/04-iop-anterior-segment.webp', width: 1344, height: 1200, alt: 'National Eye Institute side-view eye diagram showing the cornea, iris, lens, retina, optic nerve and vitreous humour.', caption: 'Whole-eye orientation for the anterior chamber and intraocular pressure.', credit: 'National Eye Institute', sourceUrl: NEI_EYE_URL },
  'vitreous-anatomy': { src: '/images/modules/aqueous/05-vitreous-anatomy.webp', width: 1049, height: 1200, alt: 'National Eye Institute cross-section highlighting the vitreous humour filling the posterior cavity between the lens and retina.', caption: 'The vitreous body fills most of the posterior segment.', credit: 'National Eye Institute', sourceUrl: NEI_EYE_URL },
  'vitreous-clinical': { src: '/images/modules/aqueous/06-vitreous-clinical.webp', width: 625, height: 577, alt: 'OpenStax eye cross-section showing the vitreous humour in direct relation to the retina and optic nerve.', caption: 'Vitreous-retina relationships are clinically important when traction develops.', credit: 'OpenStax Biology 2e · CC BY-NC-SA', sourceUrl: OPENSTAX_EYE_URL },
  'arterial-origins': { src: '/images/modules/blood/01-arterial-origins.webp', width: 1198, height: 604, alt: 'Diagram of the major arteries from the aortic arch to the carotid arteries and cerebral circulation.', caption: 'Arterial origins leading to the internal carotid and ophthalmic arteries.', credit: COURSE_CREDIT },
  ciliary: { src: '/images/modules/blood/02-ciliary-choroidal.webp', width: 800, height: 593, alt: 'Cross-section of the posterior eye showing retinal vessels, long and short posterior ciliary arteries, choroidal vessels and a vortex vein.', caption: 'Retinal and ciliary circulation in the posterior globe.', credit: COURSE_CREDIT },
  retinal: { src: '/images/modules/blood/03-retinal-faz.webp', width: 800, height: 569, alt: 'Fluorescein angiogram of the retina showing branching retinal vessels and the dark foveal avascular zone at the centre.', caption: 'Retinal circulation around the foveal avascular zone.', credit: COURSE_CREDIT },
  barriers: { src: '/images/modules/blood/04-blood-ocular-barriers.webp', width: 800, height: 511, alt: 'Comparison diagrams of retinal and choroidal capillaries, showing continuous retinal endothelium and fenestrated choroidal endothelium.', caption: 'Continuous retinal capillaries compared with fenestrated choroidal capillaries.', credit: COURSE_CREDIT },
  microcirculation: { src: '/images/modules/blood/05-retinal-microcirculation.webp', width: 500, height: 650, alt: 'Microscopic view of a narrow retinal capillary labelled with endothelial cells and pericytes.', caption: 'Endothelial cells and pericytes in the retinal capillary wall.', credit: COURSE_CREDIT },
  'clinical-blood': { src: '/images/modules/blood/06-clinical-circumciliary.webp', width: 279, height: 181, alt: 'Clinical illustration of a red eye with a concentrated ring of redness around the corneal limbus.', caption: 'Circumciliary flush is deepest around the corneal limbus.', credit: COURSE_CREDIT },
};

const section = (id: string, title: string, summary: string, bullets: string[], terms: string[], clinical: string): Section => ({ id, title, summary, bullets, terms, clinical, image: sectionImages[id] });
const f = (section: string, q: string, a: string): Fact => ({ section, q, a });

const modules: Module[] = [
  {
    id: 'ocular-adnexa', number: '01', shortTitle: 'Ocular Adnexa', title: 'Ocular Adnexa & Lacrimal Apparatus', tone: 'teal',
    description: 'Eyelid landmarks, tissue layers, glands, lacrimal anatomy, tear film and drainage.',
    coverImage: { src: '/images/modules/ocular/cover.webp', width: 900, height: 506 },
    objectives: ['Identify the external landmarks and layers of the eyelids.', 'Relate each eyelid gland and muscle to its function.', 'Trace tear production and drainage from source to nose.'],
    sections: [
      section('landmarks', 'Landmarks & topography', 'The adnexa are structures close to the globe. The palpebral aperture lies between the lids, and its nasal and temporal angles are the canthi.', ['The upper lid has a tarsal part over the globe and an orbital part extending toward the eyebrow.', 'The superior palpebral sulcus marks the transition between the tarsal and orbital parts.', 'The lids protect the globe, contribute tear components, spread the tear film and direct tears medially.'], ['Palpebral aperture — opening between the lids', 'Canthus — angle where upper and lower lids meet', 'Tarsal portion — lid segment containing the tarsal plate'], 'A reduced palpebral aperture may follow weakness of the principal upper-lid elevator.'),
      section('muscles', 'Skin, lashes & muscles', 'Eyelid skin is exceptionally thin and mobile. Beneath it, orbicularis oculi closes the lids while levator palpebrae superioris and Müller muscle elevate the upper lid.', ['Lashes are arranged in two to three rows and trigger protective blinking.', 'Orbicularis has orbital, palpebral and lacrimal portions.', 'Levator is supplied by the superior division of CN III; Müller muscle is sympathetically supplied smooth muscle.'], ['Orbicularis oculi — striated lid-closing muscle', 'Levator palpebrae superioris — principal upper-lid elevator', 'Müller muscle — sympathetically supplied smooth muscle'], 'CN III palsy can produce marked ptosis; sympathetic interruption produces a milder ptosis.'),
      section('tarsus-glands', 'Tarsus, conjunctiva & glands', 'The tarsal plate gives the lid rigidity and houses meibomian glands. Posteriorly, conjunctiva lines the lids and reflects onto the globe at the fornices.', ['Meibomian glands are modified sebaceous glands that secrete tear-film lipid.', 'Goblet cells in conjunctival epithelium secrete mucin.', 'Zeiss glands are sebaceous glands associated with lashes; Moll glands are modified sweat glands.'], ['Tarsal plate — dense supporting tissue', 'Fornix — fold between palpebral and bulbar conjunctiva', 'Goblet cell — unicellular mucin-secreting gland'], 'Blocked meibomian glands destabilize the lipid layer and can increase evaporative dry eye.'),
      section('lower-lid-blood', 'Lower lid & blood supply', 'The lower lid resembles a smaller inverted upper lid but lacks an equivalent of the levator muscle and is less mobile.', ['Its supporting tissues become more lax with age.', 'Eyelid arteries are mainly branches of the ophthalmic artery.', 'Conjunctival venous drainage reaches divisions of the ophthalmic veins.'], ['Palpebral arcade — arterial network of the lids', 'Posterior palpebral arteries — supply the conjunctiva'], 'Age-related lid laxity can disturb apposition to the globe and tear drainage.'),
      section('lacrimal-gland', 'Lacrimal gland', 'The almond-shaped lacrimal gland occupies the superolateral orbit in a depression of the frontal bone and has orbital and palpebral portions.', ['Acini drain through progressively larger ducts into about 10–12 excretory ducts.', 'The ducts open into the superior conjunctival fornix.', 'Secretomotor parasympathetic fibres originate with CN VII and reach the gland through trigeminal branches.'], ['Acinus — secretory lobule', 'Orbital portion — larger superior part', 'Palpebral portion — smaller inferior part'], 'Inflammation or enlargement in the superolateral orbit may displace the globe inferomedially.'),
      section('tears', 'Tear film & drainage', 'The tear film has an outer lipid layer, a thick aqueous layer and a mucin-rich layer at the epithelial surface.', ['Lipid comes mainly from meibomian glands; aqueous from the lacrimal and accessory lacrimal glands; mucin from conjunctival goblet cells.', 'Tears move medially into puncta, canaliculi, the lacrimal sac and nasolacrimal duct before entering the inferior nasal meatus.', 'Blinking spreads tears and the lacrimal part of orbicularis assists drainage.'], ['Schirmer test — estimates aqueous tear production', 'Punctum — entry to the drainage system', 'Inferior nasal meatus — nasal destination of the nasolacrimal duct'], 'The slide states that normal production is primarily sympathetic; standard physiology describes parasympathetic secretomotor control as dominant.'),
    ],
    facts: [
      f('landmarks','What is the opening between the upper and lower eyelids called?','Palpebral aperture'), f('landmarks','What term describes the angle where the upper and lower lids meet?','Canthus'), f('landmarks','Which furrow separates the tarsal and orbital parts of the upper lid?','Superior palpebral sulcus'), f('landmarks','Which lid portion extends from the tarsus toward the eyebrow?','Orbital portion'), f('landmarks','Which upper-lid portion contains the tarsal plate and covers the globe?','Tarsal portion'), f('landmarks','Which function directs tears toward the medial drainage area?','Eyelid movement and tear distribution'),
      f('muscles','Why can eyelid skin fold rapidly during blinking?','It is very thin and loosely attached'), f('muscles','How are eyelashes commonly arranged at the lid margin?','In two to three rows'), f('muscles','Approximately how many lashes are on the upper lid in the deck?','About 150'), f('muscles','What type of muscle is orbicularis oculi?','Striated skeletal muscle'), f('muscles','Which orbicularis portion overlies extraorbital bone?','Orbital portion'), f('muscles','Which orbicularis portion produces voluntary closure and blinking?','Palpebral portion'), f('muscles','Which orbicularis portion lies behind the lacrimal sac?','Lacrimal portion'), f('muscles','Which nerve supplies levator palpebrae superioris?','Superior division of cranial nerve III'), f('muscles','What is the principal action of levator palpebrae superioris?','Elevation of the upper lid'), f('muscles','What type of tissue forms Müller muscle?','Smooth muscle'), f('muscles','What supplies Müller muscle?','Sympathetic fibres from the superior cervical ganglion'),
      f('tarsus-glands','What is the principal mechanical role of the tarsal plate?','It provides rigidity to the lid'), f('tarsus-glands','Which structures anchor the tarsal plate nasally and temporally?','Medial and lateral palpebral ligaments'), f('tarsus-glands','Which glands lie within the tarsal plate?','Meibomian glands'), f('tarsus-glands','About how many meibomian glands are described in the upper lid?','About 30'), f('tarsus-glands','What membrane covers the posterior lids and anterior globe?','Conjunctiva'), f('tarsus-glands','What are the two main conjunctival divisions?','Palpebral and bulbar conjunctiva'), f('tarsus-glands','Where do palpebral and bulbar conjunctiva reflect into one another?','At the superior and inferior fornices'), f('tarsus-glands','Which cells produce the mucin component of tears?','Conjunctival goblet cells'), f('tarsus-glands','Which sebaceous glands empty into eyelash follicles?','Glands of Zeiss'), f('tarsus-glands','Which lid-margin glands are modified sweat glands?','Glands of Moll'), f('tarsus-glands','Which glands provide accessory aqueous tear secretion?','Glands of Krause and Wolfring'),
      f('lower-lid-blood','Which upper-lid elevator has no lower-lid equivalent?','Levator palpebrae superioris'), f('lower-lid-blood','What common age-related change affects the lower lid?','Increasing laxity and sagging'), f('lower-lid-blood','Most eyelid arteries are branches of which artery?','Ophthalmic artery'), f('lower-lid-blood','Conjunctival veins ultimately drain through which venous system?','Ophthalmic veins'),
      f('lacrimal-gland','Where is the lacrimal gland located within the orbit?','Superolateral orbit'), f('lacrimal-gland','Which bone contains the lacrimal gland depression?','Frontal bone'), f('lacrimal-gland','What is the overall shape of the lacrimal gland?','Almond-shaped'), f('lacrimal-gland','What are the two portions of the lacrimal gland?','Orbital and palpebral portions'), f('lacrimal-gland','What are the secretory lobules of the lacrimal gland called?','Acini'), f('lacrimal-gland','How many excretory ducts commonly open into the conjunctival sac?','About 10–12'), f('lacrimal-gland','Which vessel supplies the lacrimal gland?','Lacrimal artery'), f('lacrimal-gland','Parasympathetic secretomotor fibres originate with which cranial nerve?','Facial nerve (CN VII)'),
      f('tears','Which tear-film layer is outermost?','Lipid layer'), f('tears','Which tear-film layer is the thickest?','Aqueous layer'), f('tears','Which tear-film layer lies closest to the epithelium?','Mucin-rich layer'), f('tears','What is the main source of tear-film lipid?','Meibomian glands'), f('tears','What is the main source of the aqueous tear layer?','Lacrimal and accessory lacrimal glands'), f('tears','What is the main source of tear-film mucin?','Conjunctival goblet cells'), f('tears','Where do tears go after the lacrimal sac?','Nasolacrimal duct'), f('tears','Approximately what fraction of tears may be lost by evaporation?','About 25%'), f('tears','Which muscle assists the lacrimal pump during lid closure?','Lacrimal portion of orbicularis oculi'), f('tears','Which clinical test crudely measures aqueous tear production?','Schirmer test'),
    ],
  },
  {
    id: 'aqueous-vitreous', number: '02', shortTitle: 'Aqueous & Vitreous', title: 'Aqueous Humour & Vitreous Body', tone: 'blue',
    description: 'Chambers, aqueous production and drainage, intraocular pressure, vitreous structure and ageing.',
    coverImage: { src: '/images/modules/aqueous/cover.webp', width: 900, height: 506 },
    objectives: ['Describe the chambers and transparent media of the eye.', 'Trace conventional and alternate aqueous outflow.', 'Relate vitreous anatomy and age-related change to clinical findings.'],
    sections: [
      section('media-chambers','Transparent media & chambers','The internal transparent media are the crystalline lens, aqueous humour and vitreous body. Aqueous occupies the anterior and posterior chambers.', ['The anterior chamber lies between cornea and iris and is about 0.2 mL.', 'The posterior chamber is a narrow space behind the iris and in front of the lens and zonules.', 'The chambers communicate through the pupil.'], ['Anterior chamber — cornea to iris', 'Posterior chamber — iris to lens/zonules', 'Aqueous humour — clear chamber fluid'], 'A shallow anterior chamber can increase the risk of angle closure.'),
      section('production','Functions, production & composition','Aqueous nourishes avascular tissues, removes metabolic waste and helps maintain ocular form and pressure.', ['It is produced mainly by active secretion from non-pigmented ciliary epithelium, with filtration and diffusion contributing.', 'New aqueous enters the posterior chamber.', 'The blood–aqueous barrier regulates movement from blood into the eye.'], ['Ciliary process — site of aqueous production', 'Non-pigmented epithelium — active secretory layer', 'Blood–aqueous barrier — controlled exchange interface'], 'Inflammation can add protein and cells to aqueous, producing flare and risking outflow obstruction.'),
      section('flow','Flow & drainage','Aqueous flows from ciliary processes through the posterior chamber and pupil into the anterior chamber.', ['About 90% leaves by the trabecular pathway: trabecular meshwork, Schlemm canal, collector channels and aqueous veins.', 'A smaller fraction follows uveoscleral and other routes.', 'A temperature difference between warmer iris/lens and cooler cornea creates convection currents.'], ['Trabecular meshwork — principal resistance site', 'Schlemm canal — circumferential drainage channel', 'Uveoscleral outflow — alternate route through ciliary tissues'], 'Impaired trabecular drainage can elevate intraocular pressure.'),
      section('iop','Intraocular pressure','IOP reflects the balance between aqueous formation, outflow resistance and episcleral venous pressure.', ['The deck gives an approximate normal range of 10–20 mmHg.', 'Anterior-chamber aqueous has a half-life of about 45 minutes.', 'Posture, time of day and external pressure can alter a measurement.'], ['Tonometer — instrument used to measure IOP', 'Episcleral venous pressure — downstream outflow pressure', 'Diurnal variation — change during the day'], 'IOP alone does not define glaucoma; optic-nerve damage and visual-field change matter.'),
      section('vitreous-anatomy','Vitreous anatomy & composition','The vitreous fills the posterior segment behind the lens and in front of the retina. It is a transparent gel, roughly 4 mL and about 99% water.', ['Its collagen–hyaluronic acid network gives gel structure.', 'Strong attachments occur at the vitreous base near the ora serrata, optic disc and lens periphery.', 'The hyaloid canal runs from optic disc toward the posterior lens and carried the fetal hyaloid artery.'], ['Hyaloid fossa — depression for the lens', 'Vitreous base — strongest attachment zone', 'Hyaloid canal — fetal vascular pathway'], 'The retrolental potential space may collect blood or exudate in disease.'),
      section('vitreous-clinical','Function, ageing & clinical change','Vitreous transmits light, supports the posterior lens and helps maintain retinal apposition.', ['Ageing causes liquefaction that often begins posteriorly.', 'Vitreoretinal adhesion weakens with age.', 'Acute posterior vitreous separation can cause flashes and floaters and may produce a retinal tear.'], ['Syneresis — vitreous liquefaction', 'Posterior vitreous detachment — separation from posterior retina', 'Photopsia — perception of flashes'], 'New flashes, floaters or a curtain-like field defect require urgent retinal assessment.'),
    ],
    facts: [
      f('media-chambers','Which three structures form the internal transparent media?','Crystalline lens, aqueous humour and vitreous body'), f('media-chambers','Which chambers contain aqueous humour?','Anterior and posterior chambers'), f('media-chambers','What is the approximate volume of the anterior chamber?','About 0.2 mL'), f('media-chambers','What is the approximate anteroposterior depth stated for the anterior chamber?','About 3.5 mm'), f('media-chambers','What forms the main posterior boundary of the anterior chamber?','Anterior iris and central lens region'), f('media-chambers','How is the posterior chamber shaped?','A narrow slit-like space'), f('media-chambers','What bounds the posterior chamber posteriorly?','Lens and suspensory ligaments'),
      f('production','What is the normal appearance of aqueous humour?','Clear fluid'), f('production','Which avascular structures receive nutrients from aqueous?','Cornea and crystalline lens'), f('production','What metabolic role does aqueous perform besides nutrient delivery?','Removal of waste products'), f('production','How does aqueous support ocular form?','It provides positive internal pressure'), f('production','Which ocular variable is strongly governed by aqueous dynamics?','Intraocular pressure'), f('production','Where is aqueous mainly produced?','Ciliary epithelium'), f('production','Which ciliary layer actively secretes aqueous?','Non-pigmented ciliary epithelium'), f('production','Into which chamber is fresh aqueous secreted?','Posterior chamber'), f('production','Which processes contribute to aqueous formation?','Active secretion, filtration and diffusion'),
      f('flow','Through what opening does aqueous pass from posterior to anterior chamber?','Pupil'), f('flow','Which barrier regulates entry of substances into aqueous?','Blood–aqueous barrier'), f('flow','What proportion of outflow uses the conventional pathway?','About 90%'), f('flow','Which structure is encountered first in conventional outflow at the angle?','Trabecular meshwork'), f('flow','What is the correct name of the circumferential drainage canal?','Canal of Schlemm'), f('flow','What follows Schlemm canal in the drainage sequence?','Collector channels'), f('flow','Which veins receive conventional aqueous outflow?','Aqueous and episcleral veins'), f('flow','What approximate proportion uses alternate drainage routes?','About 10%'), f('flow','What percentage of chamber volume is renewed each minute in the deck?','About 1–1.5%'), f('flow','How does aqueous cross the endothelium of Schlemm canal?','Through transcellular vacuoles'), f('flow','What drives thermal circulation in the anterior chamber?','A temperature difference between cornea and iris/lens'),
      f('iop','What is the approximate half-life of anterior-chamber aqueous?','About 45 minutes'), f('iop','What daily aqueous production is stated in the deck?','About 2.8 mL'), f('iop','What must happen to keep IOP stable?','Aqueous production and outflow must balance'), f('iop','What approximate normal IOP range is given?','10–20 mmHg'), f('iop','Which production factor helps determine IOP?','Rate of aqueous formation'), f('iop','Which outflow factor helps determine IOP?','Trabecular drainage rate'), f('iop','Which downstream pressure influences IOP?','Episcleral venous pressure'), f('iop','Which instrument measures intraocular pressure?','Tonometer'),
      f('vitreous-anatomy','Where is the vitreous body located?','Behind the lens and in front of the retina'), f('vitreous-anatomy','What is the lens-shaped depression in anterior vitreous called?','Hyaloid fossa'), f('vitreous-anatomy','Where can blood or exudate collect behind the lens?','Retrolental potential space'), f('vitreous-anatomy','Where is the strongest peripheral vitreous attachment?','Vitreous base near the ora serrata'), f('vitreous-anatomy','What happens to vitreolenticular attachment with age?','It weakens'), f('vitreous-anatomy','What is the width of the hyaloid canal stated in the deck?','About 1–2 mm'), f('vitreous-anatomy','What fetal vessel occupied the hyaloid canal?','Hyaloid artery'), f('vitreous-anatomy','What is the approximate vitreous volume?','About 4 mL'), f('vitreous-anatomy','What makes up approximately 99% of vitreous?','Water'),
      f('vitreous-clinical','What is the primary optical function of vitreous?','Transmission of light'), f('vitreous-clinical','How much refractive power does vitreous contribute?','Very little'), f('vitreous-clinical','Which lens surface is supported by vitreous?','Posterior surface'), f('vitreous-clinical','What retinal role does vitreous support?','Apposition of neural and pigment retinal layers'), f('vitreous-clinical','Where does age-related vitreous liquefaction often begin?','Posteriorly'), f('vitreous-clinical','Which serious condition may follow a vitreous-related retinal tear?','Retinal detachment'),
    ],
  },
  {
    id: 'blood-supply', number: '03', shortTitle: 'Blood Supply', title: 'Blood Supply to the Eye', tone: 'coral',
    description: 'Ophthalmic artery branches, retinal and uveal circulation, barriers, capillaries and clinical integration.',
    coverImage: { src: '/images/modules/blood/cover.webp', width: 900, height: 506 },
    objectives: ['Distinguish retinal from uveal vascular supply.', 'Compare short and long posterior ciliary arteries.', 'Explain ocular blood barriers and clinically important occlusions.'],
    sections: [
      section('arterial-origins','Arterial origins & two systems','The ophthalmic artery arises from the internal carotid artery and supplies the orbit and eye through retinal and ciliary branches.', ['The central retinal artery supplies the inner retina.', 'Posterior ciliary arteries supply the choroid, ciliary body, iris, outer retina indirectly and deeper optic nerve head.', 'This dual supply explains layer-specific injury after vascular occlusion.'], ['CRA — central retinal artery', 'SPCA — short posterior ciliary artery', 'LPCA — long posterior ciliary artery'], 'Retinal tissue has high oxygen and glucose needs and is vulnerable to interrupted perfusion.'),
      section('ciliary','Ciliary & choroidal circulation','Short posterior ciliary arteries form much of the posterior choriocapillaris, while two long posterior ciliary arteries run forward through the choroid.', ['Long posterior ciliary and anterior ciliary arteries contribute to the major arterial circle of the iris.', 'Short posterior ciliary arteries also supply the optic nerve head and circle of Zinn–Haller.', 'Choroidal venous blood drains mainly through vortex veins.'], ['Choriocapillaris — capillary bed of choroid', 'Major circle of iris — arterial anastomosis', 'Vortex vein — principal choroidal venous drainage'], 'Circumciliary flush in anterior uveitis reflects deep anterior ciliary circulation.'),
      section('retinal','Retinal circulation & FAZ','The central retinal artery enters the optic nerve behind the globe and branches across the retina with limited collateral overlap.', ['Retinal vessels nourish the inner two-thirds of retinal depth.', 'Photoreceptors and other outer retinal layers depend largely on choroidal diffusion.', 'The foveal avascular zone keeps vessels away from the optical centre.'], ['FAZ — foveal avascular zone', 'Arteriole — resistance vessel', 'Venule — low-pressure collecting vessel'], 'Few effective anastomoses make central retinal artery occlusion an ocular emergency.'),
      section('barriers','Blood–ocular barriers','Tight junctions regulate exchange between ocular blood and neural or epithelial tissues.', ['The inner blood–retina barrier is formed mainly by non-fenestrated retinal capillary endothelium.', 'The outer blood–retina barrier is formed by tight junctions between retinal pigment epithelial cells.', 'Choroidal and ciliary capillaries are fenestrated and relatively permeable.'], ['Fenestrated capillary — capillary with pores', 'Continuous capillary — non-fenestrated endothelium', 'RPE — retinal pigment epithelium'], 'Barrier breakdown can produce retinal oedema and visible leakage on angiography.'),
      section('microcirculation','Retinal microcirculation','Retinal arterioles are resistance vessels; capillaries are exchange vessels where cells and solutes pass close to neural tissue.', ['Arterioles near the optic nerve head have several smooth-muscle layers that thin peripherally.', 'Capillaries are only several micrometres wide and contain endothelial cells, pericytes and basement membrane.', 'Red cells deform to move through the narrow lumen.'], ['Pericyte — contractile capillary-associated cell', 'Basement membrane — supporting extracellular layer', 'Exchange vessel — site of nutrient and gas transfer'], 'Pericyte loss and barrier dysfunction are important features of diabetic retinopathy.'),
      section('clinical-blood','Clinical integration','The pattern of visual damage depends on which vascular system and retinal depth is affected.', ['Central retinal artery compromise primarily threatens inner retina.', 'Choroidal compromise threatens photoreceptors and outer retina.', 'Anterior ciliary inflammation produces a deeper circumcorneal injection than superficial conjunctivitis.'], ['Ischaemia — inadequate perfusion', 'Circumciliary flush — deep perilimbal redness', 'Anastomosis — connection between vessels'], 'Sudden painless monocular visual loss requires urgent assessment for retinal arterial occlusion.'),
    ],
    facts: [
      f('arterial-origins','The ophthalmic artery is a branch of which major artery?','Internal carotid artery'), f('arterial-origins','Which artery directly supplies the inner retina?','Central retinal artery'), f('arterial-origins','Which arteries form the principal uveal supply?','Posterior ciliary arteries'), f('arterial-origins','How many major perfusion systems are emphasized for the retina?','Two'), f('arterial-origins','Which retinal region is nourished by central retinal circulation?','Inner retinal layers'), f('arterial-origins','Which circulation indirectly nourishes the outer retina?','Choroidal circulation'), f('arterial-origins','Which three ophthalmic branches are emphasized in the deck?','Central retinal, long posterior ciliary and short posterior ciliary arteries'), f('arterial-origins','Which two substrates are highlighted as reasons tissue needs arterial supply?','Oxygen and glucose'), f('arterial-origins','Which artery is the immediate source of the ophthalmic artery?','Internal carotid artery'),
      f('ciliary','Which vessels give rise mainly to posterior choriocapillaris?','Short posterior ciliary arteries'), f('ciliary','Which vessels contribute mainly to anterior choriocapillaris?','Long posterior ciliary arteries'), f('ciliary','How many long posterior ciliary arteries are usually described?','Two, medial and lateral'), f('ciliary','Which arteries unite to form the major circle of the iris?','Long posterior ciliary and anterior ciliary arteries'), f('ciliary','How does most choroidal venous blood leave the eye?','Vortex veins'), f('ciliary','Which vessels supply choroid and indirectly the outer retina?','Short posterior ciliary arteries'), f('ciliary','Which vessels contribute to optic nerve head supply?','Short posterior ciliary arteries'), f('ciliary','Which arterial circle surrounds the optic nerve?','Circle of Zinn–Haller'), f('ciliary','Which arteries pass forward through the choroid?','Long posterior ciliary arteries'), f('ciliary','What redness pattern is associated with anterior uveitis?','Circumciliary flush'),
      f('retinal','Approximately where does the central retinal artery enter the optic nerve?','About 10 mm behind the globe'), f('retinal','Which vessel accompanies the central retinal artery at the optic nerve?','Central retinal vein'), f('retinal','What is notable about retinal arterial anastomoses?','They are few and provide limited redundancy'), f('retinal','Why can retinal arterial occlusion be rapidly damaging?','Limited collateral circulation permits ischaemia'), f('retinal','What fraction of retinal depth is supplied by retinal vessels?','Inner two-thirds'), f('retinal','Which tissue supplies most photoreceptor metabolism?','Choroid'), f('retinal','What does FAZ stand for?','Foveal avascular zone'), f('retinal','Why is the central fovea avascular?','To allow unimpeded light transmission'), f('retinal','What determines the retinal layers damaged by vascular occlusion?','Which vascular pathway is interrupted'), f('retinal','What sequence links small retinal arteries to veins?','Arterioles, capillaries and venules'),
      f('barriers','What cellular feature is fundamental to blood–ocular barriers?','Tight junctions'), f('barriers','Which substances readily cross ocular capillary beds because of lipid solubility?','Oxygen and carbon dioxide'), f('barriers','What determines how water crosses a capillary bed?','Capillary type and membrane properties'), f('barriers','Which ocular capillaries are fenestrated?','Choroidal and ciliary-body capillaries'), f('barriers','Which ocular capillaries are continuous and least permeable?','Retinal capillaries'), f('barriers','Which capillary type is not normally found in the eye?','Discontinuous capillary'), f('barriers','What can pass through the small pores described in continuous capillaries?','Molecules smaller than roughly 9 nm'), f('barriers','What is the approximate upper range stated for large capillary pores?','About 24–70 nm'), f('barriers','What forms the inner blood–retina barrier?','Tight retinal capillary endothelial junctions'), f('barriers','What forms the outer blood–retina barrier?','Tight junctions between RPE cells'),
      f('microcirculation','What is the approximate retinal arteriole diameter at the optic nerve head?','About 100 µm'), f('microcirculation','Which layers form a retinal arteriole wall?','Endothelium, basement membrane and smooth muscle'), f('microcirculation','How many smooth-muscle layers may be present near the optic nerve head?','About five to seven'), f('microcirculation','How many smooth-muscle layers commonly remain peripherally?','About one to two'), f('microcirculation','Why are retinal arterioles called resistance vessels?','They regulate vascular resistance'), f('microcirculation','What is the approximate retinal capillary diameter?','About 3.5–6 µm'), f('microcirculation','Which mural cells are found in retinal capillaries?','Pericytes'),
      f('clinical-blood','Why does anterior uveitis produce circumciliary flush?','Shared deep anterior ciliary vascular supply'), f('clinical-blood','Which retinal compartment is most threatened by central retinal artery occlusion?','Inner retina'), f('clinical-blood','Which retinal compartment is most threatened by choroidal hypoperfusion?','Outer retina and photoreceptors'), f('clinical-blood','How do red blood cells traverse narrow retinal capillaries?','They deform and squeeze through'),
    ],
  },
];

const moduleMap = new Map(modules.map((module) => [module.id, module]));
const questionCache = new Map<string, Question[]>();

function questionsFor(module: Module): Question[] {
  const cached = questionCache.get(module.id);
  if (cached) return cached;
  const groups = new Map<string, Fact[]>();
  module.facts.forEach((fact) => groups.set(fact.section, [...(groups.get(fact.section) ?? []), fact]));
  const questions = module.facts.map((fact, index) => {
    const peers = (groups.get(fact.section) ?? module.facts).filter((item) => item.a !== fact.a);
    const fallback = module.facts.filter((item) => item.a !== fact.a);
    const pool = peers.length >= 3 ? peers : fallback;
    const distractors = [1, 2, 3].map((offset) => pool[(index + offset) % pool.length].a);
    const sectionData = module.sections.find((item) => item.id === fact.section)!;
    return { id: `${module.id}-${index + 1}`, prompt: fact.q, options: [fact.a, ...distractors], correct: fact.a, explanation: `${fact.a}. ${sectionData.summary}`, sectionId: fact.section };
  });
  questionCache.set(module.id, questions);
  return questions;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function loadStore(): Store {
  if (typeof window === 'undefined') return EMPTY_STORE;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return parsed?.version === 1 ? parsed : EMPTY_STORE;
  } catch { return EMPTY_STORE; }
}

function pathState() {
  if (typeof window === 'undefined') return { view: 'home', moduleId: '' };
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'study' || parts[0] === 'quiz' || parts[0] === 'results') return { view: parts[0], moduleId: parts[1] ?? '' };
  return { view: 'home', moduleId: '' };
}

function createAttempt(module: Module): Attempt {
  const questions = questionsFor(module);
  return { id: `${module.id}-${Date.now()}`, moduleId: module.id, startedAt: new Date().toISOString(), order: shuffled(questions.map((q) => q.id)), optionOrder: Object.fromEntries(questions.map((q) => [q.id, shuffled(q.options)])), answers: {}, flags: [], current: 0 };
}

export default function StudyApp() {
  const [route, setRoute] = useState({ view: 'home', moduleId: '' });
  const [store, setStore] = useState<Store>(EMPTY_STORE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRoute(pathState());
      setStore(loadStore());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }, [store, hydrated]);
  useEffect(() => {
    const onPop = () => setRoute(pathState());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (view: string, moduleId = '') => {
    const path = view === 'home' ? '/' : `/${view}/${moduleId}`;
    window.history.pushState({}, '', path);
    setRoute({ view, moduleId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateStore = (updater: (current: Store) => Store) => setStore((current) => updater(current));
  const activeModule = moduleMap.get(route.moduleId);

  const startQuiz = (target: Module, force = false) => {
    const existing = store.active[target.id];
    if (existing && !force) { go('quiz', target.id); return; }
    if (existing && force && !window.confirm('Restart this attempt? Your current answers will be cleared.')) return;
    const attempt = createAttempt(target);
    updateStore((current) => ({ ...current, active: { ...current.active, [target.id]: attempt } }));
    go('quiz', target.id);
  };

  const clearModule = (id: string) => {
    if (!window.confirm('Clear reading progress, active quiz and score history for this module?')) return;
    updateStore((current) => ({ ...current, read: { ...current.read, [id]: [] }, active: { ...current.active, [id]: undefined }, results: { ...current.results, [id]: [] } }));
  };

  if (!activeModule && route.view !== 'home') return <main className="shell"><Header go={go}/><div className="empty"><h1>Module not found</h1><button onClick={() => go('home')}>Return home</button></div></main>;

  return (
    <main className="shell">
      <Header go={go}/>
      {route.view === 'home' ? <Home store={store} go={go} startQuiz={startQuiz} clearModule={clearModule} resetAll={() => { if (window.confirm('Reset all OPT 376 progress and scores on this device?')) setStore(EMPTY_STORE); }} /> : null}
      {route.view === 'study' && activeModule ? <Study module={activeModule} read={store.read[activeModule.id] ?? []} onToggle={(sectionId) => updateStore((current) => { const present = current.read[activeModule.id] ?? []; const next = present.includes(sectionId) ? present.filter((id) => id !== sectionId) : [...present, sectionId]; return { ...current, read: { ...current.read, [activeModule.id]: next } }; })} go={go} startQuiz={startQuiz}/> : null}
      {route.view === 'quiz' && activeModule ? <Quiz module={activeModule} attempt={store.active[activeModule.id]} onAttempt={(attempt) => updateStore((current) => ({ ...current, active: { ...current.active, [activeModule.id]: attempt } }))} onSubmit={(result) => updateStore((current) => ({ ...current, active: { ...current.active, [activeModule.id]: undefined }, results: { ...current.results, [activeModule.id]: [result, ...(current.results[activeModule.id] ?? [])].slice(0, 20) } }))} go={go} startQuiz={startQuiz}/> : null}
      {route.view === 'results' && activeModule ? <Results module={activeModule} result={(store.results[activeModule.id] ?? [])[0]} go={go} startQuiz={startQuiz}/> : null}
      <footer><p>OPT 376 Eye Anatomy Review · Progress stays on this device.</p><button className="text-button" onClick={() => go('home')}>All modules</button></footer>
    </main>
  );
}

function Header({ go }: { go: (view: string, moduleId?: string) => void }) {
  return <header className="site-header"><button className="brand" onClick={() => go('home')} aria-label="OPT 376 home"><span className="brand-mark" aria-hidden="true"><i/></span><span><b>OPT 376</b><small>Eye Anatomy Review</small></span></button><span className="device-note">Private study progress · saved on device</span></header>;
}

function Home({ store, go, startQuiz, clearModule, resetAll }: { store: Store; go: (view: string, id?: string) => void; startQuiz: (m: Module) => void; clearModule: (id: string) => void; resetAll: () => void }) {
  const completed = modules.reduce((sum, item) => sum + (store.read[item.id]?.length ?? 0), 0);
  const totalSections = modules.reduce((sum, item) => sum + item.sections.length, 0);
  return <>
    <section className="hero"><div className="hero-copy"><h1>Study smarter.<br/><em>See the whole eye.</em></h1><p>Three focused modules turn your OPT 376 slides into clear notes, clinical connections and 150 practice questions.</p><div className="hero-actions"><button className="primary" onClick={() => go('study', modules[0].id)}>Begin with module 01</button><span>{completed}/{totalSections} sections reviewed</span></div></div><div className="eye-visual" aria-label="Stylised iris motif"><div className="iris"><div className="pupil"/></div><div className="orbit-line one"/><div className="orbit-line two"/></div></section>
    <section className="overview"><div><span>YOUR COURSE</span><h2>One eye. Three systems.</h2></div><div className="overall-progress"><strong>{Math.round((completed / totalSections) * 100) || 0}%</strong><span>reading complete</span></div></section>
    <section className="module-grid">{modules.map((item) => {
      const read = store.read[item.id]?.length ?? 0; const progress = Math.round((read / item.sections.length) * 100); const history = store.results[item.id] ?? []; const latest = history[0]; const best = history.length ? Math.max(...history.map((r) => r.score)) : undefined;
      return <article className={`module-card ${item.tone}`} key={item.id}><div className="module-number">{item.number}</div><div className="module-art" aria-hidden="true"><img src={item.coverImage.src} width={item.coverImage.width} height={item.coverImage.height} alt="" loading="lazy" decoding="async"/></div><div className="module-body"><h3>{item.title}</h3><p>{item.description}</p><div className="progress-row"><div><i style={{width: `${progress}%`}}/></div><span>{progress}%</span></div><div className="score-row"><span>Latest <b>{latest ? `${latest.score}/50` : '—'}</b></span><span>Best <b>{best === undefined ? '—' : `${best}/50`}</b></span></div><div className="card-actions"><button className="secondary" onClick={() => go('study', item.id)}>Read notes</button><button className="primary small" onClick={() => startQuiz(item)}>{store.active[item.id] ? 'Resume quiz' : 'Take quiz'}</button></div><button className="text-button danger" onClick={() => clearModule(item.id)}>Clear module data</button></div></article>;
    })}</section>
    <section className="privacy-panel"><div><h2>Your learning stays yours.</h2><p>Answers, reading progress and up to 20 recent attempts per module are stored only in this browser.</p></div><button className="secondary danger" onClick={resetAll}>Reset all study data</button></section>
  </>;
}

function Study({ module, read, onToggle, go, startQuiz }: { module: Module; read: string[]; onToggle: (id: string) => void; go: (view: string, id?: string) => void; startQuiz: (m: Module) => void }) {
  const progress = Math.round((read.length / module.sections.length) * 100);
  const [expanded, setExpanded] = useState<Figure | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeFigure = () => {
    setExpanded(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setExpanded(null);
        window.setTimeout(() => triggerRef.current?.focus(), 0);
        return;
      }
      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button, a[href]'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  const openFigure = (image: Figure, event: ReactMouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget;
    setExpanded(image);
  };

  return <>
    <section className={`module-hero ${module.tone}`}><button className="back" onClick={() => go('home')}>← All modules</button><div><span>MODULE {module.number}</span><h1>{module.title}</h1><p>{module.description}</p></div><div className="round-progress"><strong>{progress}%</strong><span>reviewed</span></div></section>
    <div className="study-layout"><aside><div className="aside-card"><h2>Learning objectives</h2><ol>{module.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ol></div><nav aria-label="Module sections"><h2>On this page</h2>{module.sections.map((item, index) => <a key={item.id} href={`#${item.id}`} className={read.includes(item.id) ? 'done' : ''}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}</a>)}</nav><button className="primary full" onClick={() => startQuiz(module)}>Start 50-question quiz</button></aside><div className="notes"><div className="source-note"><b>Study note</b><span>Rewritten from the supplied OPT 376 slides. Figures are drawn from the course decks and attributed educational sources. A correction note is included where slide wording conflicts with standard physiology.</span></div>{module.sections.map((item, index) => <article className="note-section" id={item.id} key={item.id}><div className="section-heading"><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{item.title}</h2><p>{item.summary}</p></div></div><div className="section-learning"><figure className="section-figure"><button className="figure-button" type="button" onClick={(event) => openFigure(item.image, event)} aria-label={`Enlarge figure: ${item.image.caption}`}><img src={item.image.src} width={item.image.width} height={item.image.height} alt={item.image.alt} loading="lazy" decoding="async"/></button><figcaption><span>{item.image.caption}</span><small>Source: {item.image.sourceUrl ? <a href={item.image.sourceUrl} target="_blank" rel="noreferrer">{item.image.credit}</a> : item.image.credit}</small></figcaption></figure><ul className="key-points">{item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></div><div className="terms"><h3>Key terms</h3>{item.terms.map((term) => { const [name, definition] = term.split(' — '); return <div key={term}><b>{name}</b><span>{definition}</span></div>; })}</div><div className="clinical"><span>Clinical connection</span><p>{item.clinical}</p></div><button className={read.includes(item.id) ? 'complete-button complete' : 'complete-button'} onClick={() => onToggle(item.id)}>{read.includes(item.id) ? '✓ Reviewed' : 'Mark section reviewed'}</button></article>)}</div></div>
    {expanded ? <div className="figure-modal" onMouseDown={(event) => { if (event.currentTarget === event.target) closeFigure(); }}><div className="figure-dialog" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="figure-dialog-title"><button className="figure-close" type="button" ref={closeButtonRef} onClick={closeFigure} aria-label="Close enlarged figure">Close <span aria-hidden="true">×</span></button><img src={expanded.src} width={expanded.width} height={expanded.height} alt={expanded.alt}/><div className="figure-dialog-caption"><h2 id="figure-dialog-title">{expanded.caption}</h2><p>Source: {expanded.sourceUrl ? <a href={expanded.sourceUrl} target="_blank" rel="noreferrer">{expanded.credit}</a> : expanded.credit}</p></div></div></div> : null}
  </>;
}

function Quiz({ module, attempt, onAttempt, onSubmit, go, startQuiz }: { module: Module; attempt?: Attempt; onAttempt: (a: Attempt) => void; onSubmit: (r: Result) => void; go: (view: string, id?: string) => void; startQuiz: (m: Module, force?: boolean) => void }) {
  const questions = useMemo(() => questionsFor(module), [module]);
  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  if (!attempt) return <section className="empty"><h1>No active attempt</h1><p>Start a fresh shuffled 50-question quiz.</p><button className="primary" onClick={() => startQuiz(module)}>Start quiz</button></section>;
  const questionId = attempt.order[attempt.current]; const question = byId.get(questionId)!; const answered = Object.keys(attempt.answers).length; const flagged = attempt.flags.includes(questionId);
  const patch = (changes: Partial<Attempt>) => onAttempt({ ...attempt, ...changes });
  const submit = () => { const unanswered = attempt.order.length - answered; if (unanswered && !window.confirm(`You still have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Submit anyway?`)) return; const score = attempt.order.reduce((sum, id) => sum + (attempt.answers[id] === byId.get(id)?.correct ? 1 : 0), 0); const result: Result = { ...attempt, score, total: 50, submittedAt: new Date().toISOString() }; onSubmit(result); go('results', module.id); };
  return <section className="quiz-shell"><div className="quiz-top"><button className="back" onClick={() => go('home')}>← Save & exit</button><div><span>{module.shortTitle}</span><b>{answered}/50 answered</b></div><button className="text-button danger" onClick={() => startQuiz(module, true)}>Restart</button></div><div className="quiz-progress"><i style={{width: `${((attempt.current + 1) / 50) * 100}%`}}/></div><div className="quiz-grid"><aside className="navigator"><h2>Question navigator</h2><div>{attempt.order.map((id, index) => <button key={id} aria-label={`Question ${index + 1}`} onClick={() => patch({ current: index })} className={`${index === attempt.current ? 'current' : ''} ${attempt.answers[id] ? 'answered' : ''} ${attempt.flags.includes(id) ? 'flagged' : ''}`}>{index + 1}</button>)}</div><div className="legend"><span><i className="answered"/>Answered</span><span><i className="flagged"/>Flagged</span></div></aside><article className="question-card"><div className="question-meta"><span>QUESTION {attempt.current + 1} OF 50</span><button className={flagged ? 'flag active' : 'flag'} onClick={() => patch({ flags: flagged ? attempt.flags.filter((id) => id !== questionId) : [...attempt.flags, questionId] })}>{flagged ? '★ Flagged' : '☆ Flag for review'}</button></div><h1>{question.prompt}</h1><fieldset><legend className="sr-only">Answer choices</legend>{attempt.optionOrder[questionId].map((option, index) => <label key={option} className={attempt.answers[questionId] === option ? 'option selected' : 'option'}><input type="radio" name={questionId} checked={attempt.answers[questionId] === option} onChange={() => patch({ answers: { ...attempt.answers, [questionId]: option } })}/><span>{String.fromCharCode(65 + index)}</span><b>{option}</b></label>)}</fieldset><div className="quiz-actions"><button className="secondary" disabled={attempt.current === 0} onClick={() => patch({ current: Math.max(0, attempt.current - 1) })}>Previous</button>{attempt.current < 49 ? <button className="primary" onClick={() => patch({ current: attempt.current + 1 })}>Next question</button> : <button className="primary coral" onClick={submit}>Submit quiz</button>}</div><button className="submit-link" onClick={submit}>Submit quiz now</button></article></div></section>;
}

function Results({ module, result, go, startQuiz }: { module: Module; result?: Result; go: (view: string, id?: string) => void; startQuiz: (m: Module, force?: boolean) => void }) {
  const questions = questionsFor(module); const byId = new Map(questions.map((q) => [q.id, q]));
  if (!result) return <section className="empty"><h1>No submitted result yet</h1><button className="primary" onClick={() => startQuiz(module)}>Take the quiz</button></section>;
  const unanswered = result.order.filter((id) => !result.answers[id]).length; const incorrect = result.total - result.score - unanswered; const percent = Math.round((result.score / result.total) * 100);
  return <section className="results"><button className="back" onClick={() => go('home')}>← Dashboard</button><div className="result-hero"><div><span>QUIZ COMPLETE</span><h1>{module.shortTitle}</h1><p>{percent >= 80 ? 'Excellent work — your core understanding is strong.' : percent >= 60 ? 'A solid attempt. Review the missed sections and try again.' : 'Use the review below to target the topics that need another pass.'}</p></div><div className="score-circle"><strong>{percent}%</strong><span>{result.score}/50 correct</span></div></div><div className="result-stats"><span><b>{result.score}</b>Correct</span><span><b>{incorrect}</b>Incorrect</span><span><b>{unanswered}</b>Unanswered</span><span><b>{new Date(result.submittedAt).toLocaleDateString()}</b>Submitted</span></div><div className="result-actions"><button className="primary" onClick={() => startQuiz(module, true)}>Retake shuffled quiz</button><button className="secondary" onClick={() => go('study', module.id)}>Review study notes</button></div><h2 className="review-title">Answer review</h2><div className="review-list">{result.order.map((id, index) => { const q = byId.get(id)!; const selected = result.answers[id]; const correct = selected === q.correct; return <details key={id} className={correct ? 'review correct' : 'review incorrect'}><summary><span>{String(index + 1).padStart(2, '0')}</span><div><b>{q.prompt}</b><small>{correct ? 'Correct' : selected ? 'Incorrect' : 'Unanswered'}</small></div><i>{correct ? '✓' : '!'}</i></summary><div className="review-body"><p><span>Your answer</span><b>{selected ?? 'No answer selected'}</b></p>{!correct ? <p><span>Correct answer</span><b>{q.correct}</b></p> : null}<p className="explanation">{q.explanation}</p><button className="text-button" onClick={() => { go('study', module.id); setTimeout(() => document.getElementById(q.sectionId)?.scrollIntoView({ behavior: 'smooth' }), 50); }}>Open related notes →</button></div></details>; })}</div></section>;
}
