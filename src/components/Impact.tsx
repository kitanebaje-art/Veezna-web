"use client";

export default function Impact() {


const stats = [
  {
    number:"500+",
    title:"Students Guided",
    text:"Helping learners achieve academic and personal growth"
  },

  {
    number:"4+",
    title:"Learning Programs",
    text:"Complete ecosystem for skills and development"
  },

  {
    number:"360°",
    title:"Learning Approach",
    text:"Knowledge, confidence and practical skills"
  },

  {
    number:"VLS",
    title:"Learning System",
    text:"A structured method designed for transformation"
  }
];


return (

<section className="
py-24
bg-white
">


<div className="
max-w-7xl
mx-auto
px-6
">


<div className="
text-center
mb-16
">


<span className="
text-orange-500
font-semibold
tracking-widest
">

OUR IMPACT

</span>


<h2 className="
mt-4
text-4xl
md:text-5xl
font-bold
text-blue-800
">

Growing With Purpose

</h2>


<p className="
mt-5
text-gray-600
text-lg
">

Building confident learners for a better future.

</p>


</div>





<div className="
grid
md:grid-cols-2
lg:grid-cols-4
gap-8
">


{
stats.map((item)=>(


<div
key={item.title}
className="
group
bg-gradient-to-br
from-blue-50
to-white
rounded-3xl
p-8
border
border-gray-100
shadow-lg
hover:-translate-y-3
hover:shadow-2xl
transition-all
duration-500
"
>


<h3 className="
text-5xl
font-bold
text-blue-700
group-hover:text-orange-500
transition
">

{item.number}

</h3>


<h4 className="
mt-5
text-xl
font-bold
text-gray-800
">

{item.title}

</h4>


<p className="
mt-3
text-gray-600
leading-relaxed
">

{item.text}

</p>


</div>


))
}


</div>


</div>


</section>

)

}