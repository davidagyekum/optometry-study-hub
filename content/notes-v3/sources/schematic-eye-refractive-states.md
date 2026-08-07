# The Schematic Eye and the Unaccommodated Refractive State - Teachable Notes

**Course:** OPT 370 Dispensing Optics II  
**Module ID:** `schematic-eye-refractive-states`  
**Primary source:** *The schematic eye - unaccommodated* (63 slides)  
**Stable section IDs:** `vergence-paraxial`, `schematic-models`, `emmetropia`, `myopia`, `hyperopia`, `far-point-axial`

---

## How to use this module

This module is best learned as a chain of four questions:

1. What is the vergence of the light arriving at the eye?
2. How much vergence does the eye add?
3. Where does the refracted light come to focus?
4. Does that focus coincide with the retina?

The central relationship is:

```text
image vergence = object vergence + optical power
L' = L + P
```

Use metres whenever vergence is required in dioptres. Keep the source sign convention throughout:

- diverging light: negative vergence;
- converging light: positive vergence;
- a real object in front of the eye: negative object distance;
- a real image behind the refracting surface: positive image distance.

> **Source approach:** Numerical constants and worked examples are retained from the supplied lecture. The note explains the reasoning in more detail but does not silently replace the lecturer's model with a different schematic-eye convention.

---

<a id="vergence-paraxial"></a>
# 1. Vergence and Paraxial Rays

## 1.1 What vergence means

**Vergence** describes how strongly a wavefront is converging toward a point or diverging away from a point. It is measured in dioptres (D).

The lecture defines vergence as:

\[
L=\frac{n}{l}
\]

where:

- \(L\) = vergence in dioptres;
- \(n\) = refractive index of the medium;
- \(l\) = distance from the reference plane to the object or focus, in metres.

A useful interpretation is that vergence is the optical “steepness” of the wavefront. A nearby point produces a strongly curved wavefront and therefore a larger numerical vergence. A very distant object produces nearly plane wavefronts and has vergence close to zero.

### Sign convention

| Light state | Sign | Meaning |
|---|---:|---|
| Diverging | negative | rays are spreading from a real object or virtual focus |
| Plane | zero | object or focus is at optical infinity |
| Converging | positive | rays are approaching a real focus |

### Worked example: converging wavefront at 20 cm

A converging wavefront in air is heading toward a point 20 cm away.

\[
l=+20\text{ cm}=+0.20\text{ m},\quad n=1.00
\]

\[
L=\frac{1.00}{+0.20}=+5.00\text{ D}
\]

The positive sign indicates convergence.

### Worked example: real object at 50 cm

A real object is 50 cm in front of the eye. The light reaching the eye is diverging.

\[
l=-0.50\text{ m}
\]

\[
L=\frac{1.00}{-0.50}=-2.00\text{ D}
\]

## 1.2 The vergence relationship

At a refracting surface or thin optical system:

\[
L'=L+P
\]

where:

- \(L\) is object vergence before refraction;
- \(P\) is the power added by the surface or eye;
- \(L'\) is image vergence after refraction.

This equation is the engine behind all of the reduced-eye calculations in the lecture.

### A reliable calculation routine

1. Convert every distance to metres, unless the formula has been explicitly rearranged for millimetres.
2. Determine whether incoming light is diverging, plane, or converging.
3. Assign the sign to \(L\).
4. Add the eye or lens power.
5. Convert \(L'\) to an image distance with \(l'=n'/L'\).
6. Compare the image distance with the retinal distance.

## 1.3 Paraxial rays

**Paraxial rays** are rays close to the optical axis that make only small angles with it. Under the paraxial approximation:

\[
\sin\theta\approx\theta,\quad \tan\theta\approx\theta,\quad \cos\theta\approx1
\]

The lecture describes angles of roughly less than 10 degrees as typical of this approximation. Paraxial analysis simplifies the eye into a tractable first-order optical system. It is not a complete description of peripheral rays or aberrations.

## 1.4 Surface power

For a single refracting surface:

\[
P=\frac{n'-n}{r}
\]

where:

- \(n\) = refractive index before the surface;
- \(n'\) = refractive index after the surface;
- \(r\) = radius of curvature in metres.

In the lecture's reduced eye, the single surface separates air \((n=1.000)\) from ocular media \((n'=1.333)\), with radius approximately 5.55 mm.

\[
P=\frac{1.333-1.000}{0.00555}\approx+60.00\text{ D}
\]

## 1.5 Common errors

- Using centimetres directly in \(L=n/l\).
- Forgetting that a real object in front of the eye produces negative vergence.
- Using the refractive index of air when converting image vergence inside the eye.
- Treating “power of the eye” and “refractive error of the eye” as identical quantities.
- Deciding that an eye is myopic or hyperopic from power alone without considering axial length.

---

<a id="schematic-models"></a>
# 2. Gullstrand and Reduced-Eye Models

## 2.1 Why a schematic eye is needed

The biological eye contains several refracting surfaces and media. Exact analysis can include the anterior and posterior corneal surfaces, lens cortex, lens nucleus, principal planes, nodal points, and refractive indices. For many clinical problems, that level of detail is unnecessary. A **schematic eye** replaces the biological system with a defined optical model.

The supplied lecture distinguishes three levels.

## 2.2 Gullstrand No. 1: the exact eye

The lecture's **Gullstrand No. 1 eye** is the more detailed model. It represents six refracting surfaces, including:

- anterior and posterior corneal surfaces;
- anterior and posterior surfaces associated with the lens cortex;
- anterior and posterior surfaces associated with the lens nucleus.

The deck gives refractive indices such as approximately 1.376 for the cornea, 1.387 for the lens cortex, and 1.406 for the lens nucleus. Its purpose is to represent the optical complexity of the eye more faithfully.

## 2.3 Gullstrand No. 2: the simplified eye

The **Gullstrand No. 2 eye** reduces the system to three main refracting surfaces:

- one corneal surface;
- two lens surfaces.

It retains more anatomical structure than the reduced eye but is easier to calculate than the exact eye.

## 2.4 The reduced eye

The **reduced eye** treats the eye as if refraction occurs at a single equivalent surface. In the lecture model:

- air has \(n=1.000\);
- the ocular medium has \(n'=1.333\);
- equivalent power is approximately +60.00 D;
- radius of the equivalent surface is approximately 5.55 mm;
- the nodal point is located at the centre of curvature of the equivalent surface;
- the secondary focal distance is approximately 22.22 mm behind the surface.

This model is highly useful for day-to-day refractive-state calculations.

## 2.5 What the models do and do not say

A model is a controlled simplification. The reduced eye does not mean that the real eye has only one surface. It means that, for the question being solved, the combined first-order effect of the real surfaces is represented by one equivalent surface.

### Comparison

| Model | Refracting detail | Main strength | Main limitation |
|---|---|---|---|
| Gullstrand No. 1 | six surfaces | closer representation of ocular optics | calculation complexity |
| Gullstrand No. 2 | three surfaces | useful compromise | still simplified |
| Reduced eye | one equivalent surface | fast clinical calculations | does not show individual surface effects |

---

<a id="emmetropia"></a>
# 3. Emmetropia and Emmetropization

## 3.1 Definition of emmetropia

**Emmetropia** is the unaccommodated refractive state in which light from optical infinity is focused on the retina.

For an object at infinity:

\[
L=0\text{ D}
\]

For the lecture's reduced eye:

\[
L'=L+P=0+60.00=+60.00\text{ D}
\]

Inside the eye, \(n'=1.333\), therefore:

\[
l'=\frac{n'}{L'}=\frac{1.333}{60.00}=0.02222\text{ m}=22.22\text{ mm}
\]

Thus an eye with +60.00 D power and a retina 22.22 mm behind the equivalent surface is emmetropic.

## 3.2 Optical meaning

For an emmetropic, unaccommodated eye:

- the far point is at optical infinity;
- plane incident waves are focused on the retina;
- the retina coincides with the secondary focal point of the eye;
- no correcting lens is required for distance vision in the simplified model.

## 3.3 A longer eye can still be emmetropic

Power and axial length must be matched. The lecture gives an example of an emmetropic eye represented by a lens-screen separation of 23.00 mm. The power required is:

\[
P=\frac{1.333}{0.02300}=+57.96\text{ D}
\]

This eye is longer than the standard reduced eye, but its optical power is weaker. The focus still coincides with the retina, so the eye remains emmetropic.

## 3.4 Emmetropization

**Emmetropization** is the developmental process by which ocular growth and optical power become coordinated toward emmetropia.

The supplied lecture states that:

- the newborn eye is relatively short and commonly has approximately +2.00 to +3.00 D hypermetropia;
- this tends to decrease as the eye grows;
- by roughly 5-7 years, many eyes approach emmetropia;
- some eyes remain hyperopic or grow beyond emmetropia into myopia;
- later life may again show a hyperopic tendency.

The central principle is not that every eye reaches exactly the same dimensions. It is that axial length and refractive power can compensate for each other.

### Cause-effect model

```text
longer axial length + unchanged power -> focus falls in front of retina -> myopic tendency
shorter axial length + unchanged power -> focus falls behind retina -> hyperopic tendency
longer axial length + proportionally weaker power -> focus may remain on retina
shorter axial length + proportionally stronger power -> focus may remain on retina
```

---

<a id="myopia"></a>
# 4. Myopia in the Reduced-Eye Model

## 4.1 Definition

An unaccommodated eye is **myopic** when light from optical infinity is focused in front of the retina.

This can happen because:

- the eye is too long for its power;
- the eye is too powerful for its length;
- both factors occur together.

## 4.2 Example: +60.00 D eye with axial length 23.22 mm

The retinal plane requires image vergence:

\[
L'=\frac{1.333}{0.02322}=+57.41\text{ D}
\]

The eye adds +60.00 D, so the incoming vergence that would focus on the retina is:

\[
L=L'-P=57.41-60.00=-2.59\text{ D}
\]

The negative result means the rays must be diverging when they reach the eye. The far point is:

\[
l=\frac{1.000}{-2.59}=-0.3861\text{ m}=-38.61\text{ cm}
\]

Therefore:

- the far point is 38.61 cm in front of the cornea;
- the refractive error is approximately -2.59 D;
- the practical spectacle correction at the corneal plane is approximately -2.50 D in the lecture example.

## 4.3 Far point in myopia

The **far point** is the object point conjugate with the retina when accommodation is relaxed. In myopia, it lies at a finite distance in front of the eye.

Objects farther away than the far point send less divergent rays and are focused in front of the retina. A minus lens makes rays from a distant object diverge as though they originated at the far point.

```text
object at infinity
-> minus correcting lens
-> virtual image at myopic far point
-> myopic eye focuses that vergence on retina
```

## 4.4 Example: +60.00 D eye with axial length 24.00 mm

Retinal image vergence:

\[
L'=\frac{1.333}{0.02400}=+55.54\text{ D}
\]

Required object vergence:

\[
L=55.54-60.00=-4.46\text{ D}
\]

Far-point distance:

\[
l=\frac{1.000}{-4.46}=-0.2242\text{ m}=-22.42\text{ cm}
\]

This eye is approximately 4.46 D myopic in the model.

## 4.5 Example from the lecture: Fati

Fati's unaccommodated eye has:

- power: +62.00 D;
- far point: 50 cm in front of the eye.

Far-point vergence:

\[
L=\frac{1.00}{-0.50}=-2.00\text{ D}
\]

So the lens correction is -2.00 D at the eye plane.

Image vergence after the eye:

\[
L'=P+L=62.00+(-2.00)=+60.00\text{ D}
\]

The corresponding lens-screen distance is:

\[
l'=\frac{1.333}{60.00}=22.22\text{ mm}
\]

## 4.6 Clinical interpretation

The closer the myopic far point is to the eye, the larger the absolute myopic refractive error. A far point at 1 m corresponds to approximately -1.00 D; at 50 cm, approximately -2.00 D; at 25 cm, approximately -4.00 D.

---

<a id="hyperopia"></a>
# 5. Hyperopia in the Reduced-Eye Model

## 5.1 Definition

An unaccommodated eye is **hyperopic** when light from optical infinity would focus behind the retina.

This can happen because:

- the eye is too short for its power;
- the eye is too weak for its length;
- both factors occur together.

## 5.2 Example: +60.00 D eye with axial length 21.22 mm

The retinal plane requires:

\[
L'=\frac{1.333}{0.02122}=+62.82\text{ D}
\]

The eye supplies +60.00 D, so the incoming light must already be converging:

\[
L=L'-P=62.82-60.00=+2.82\text{ D}
\]

The positive far-point vergence indicates a virtual object behind the eye. Its distance is approximately:

\[
l=\frac{1.000}{+2.82}=+0.3546\text{ m}=35.46\text{ cm behind the cornea}
\]

The required correction at the corneal plane is approximately +2.82 D.

## 5.3 Far point in hyperopia

In hyperopia, the far point is virtual and lies behind the eye. A plus correcting lens converges rays from infinity so they enter the eye with the positive vergence needed to focus on the retina.

Without correction, a patient with sufficient accommodation may add some or all of the missing plus power. The lecture calculations, however, describe the unaccommodated state.

## 5.4 Example: +60.00 D eye with retina at 21.33 mm

The retinal vergence is:

\[
A=\frac{1.333}{0.02133}=+62.50\text{ D}
\]

Far-point vergence:

\[
F_{FP}=A-P_{eye}=62.50-60.00=+2.50\text{ D}
\]

The lecture locates the virtual far point approximately 40 cm behind the eye.

## 5.5 Example from the lecture: Ama

Ama's eye is represented by:

- eye power: +54.00 D;
- axial length: 22.22 mm.

The retinal plane requires approximately +60.00 D. Therefore:

\[
F_{FP}=60.00-54.00=+6.00\text{ D}
\]

Ama is a 6.00 D hyperope in the model and requires a +6.00 D contact lens at the corneal plane. The source places the virtual far point approximately 22.22 cm behind the eye.

---

<a id="far-point-axial"></a>
# 6. Far-Point Vergence and Axial Length

## 6.1 The far-point relationship

The lecture combines retinal demand, far-point vergence, and eye power as:

\[
A=F_{FP}+P_{eye}
\]

where:

\[
A=\frac{1.333}{a}
\]

and:

- \(A\) = vergence required at the retina;
- \(a\) = axial length in metres;
- \(F_{FP}\) = far-point vergence;
- \(P_{eye}\) = power of the reduced eye.

Rearrangements:

\[
F_{FP}=\frac{1.333}{a}-P_{eye}
\]

\[
a=\frac{1.333}{F_{FP}+P_{eye}}
\]

## 6.2 Example: +60.00 D eye, axial length 25.00 mm

\[
A=\frac{1.333}{0.02500}=+53.32\text{ D}
\]

\[
F_{FP}=53.32-60.00=-6.68\text{ D}
\]

The eye is approximately 6.68 D myopic. The far point is:

\[
f_{FP}=\frac{1.00}{-6.68}=-0.1497\text{ m}=-14.97\text{ cm}
\]

## 6.3 Example: axial length for 1.00 D myopia

Given:

- \(P_{eye}=+60.00\text{ D}\);
- \(F_{FP}=-1.00\text{ D}\).

\[
a=\frac{1.333}{60.00-1.00}=0.02259\text{ m}=22.59\text{ mm}
\]

This is approximately 0.37 mm longer than 22.22 mm.

The lecture gives the useful rule of thumb:

> Approximately every one-third millimetre increase in axial length produces about 1.00 D of myopic shift, when other factors are held constant.

This is a teaching approximation, not a replacement for biometric calculation.

## 6.4 Master problem-solving template

### Given eye power and axial length

1. Calculate retinal demand: \(A=1.333/a\).
2. Calculate far-point vergence: \(F_{FP}=A-P_{eye}\).
3. Classify:
   - \(F_{FP}=0\): emmetropia;
   - \(F_{FP}<0\): myopia;
   - \(F_{FP}>0\): hyperopia.
4. The corneal-plane correction is numerically equal to \(F_{FP}\) in the thin-lens model.
5. Locate the far point with \(f_{FP}=1/F_{FP}\) in air.

### Given far point and eye power

1. Convert far-point distance to vergence.
2. Add it to eye power to find retinal vergence.
3. Convert retinal vergence to axial length.

## 6.5 Final mastery checklist

You should be able to:

- define vergence and use the correct sign;
- explain why metres are required for dioptres;
- distinguish exact, simplified, and reduced schematic eyes;
- calculate the +60.00 D reduced-eye focal distance;
- define emmetropia, myopia, and hyperopia optically;
- locate a far point from refractive error;
- calculate refractive error from eye power and axial length;
- explain how a minus lens corrects myopia and a plus lens corrects hyperopia;
- distinguish eye power from refractive error;
- apply the axial-length rule of thumb without treating it as exact.
