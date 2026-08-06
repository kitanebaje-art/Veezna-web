import Image from "next/image";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Pillars from "@/components/Pillars";
import Courses from "@/components/Courses";
import TrustSection from "@/components/TrustSection";
import AboutVeezna from "@/components/AboutVeezna";
import Testimonials from "@/components/Testimonials";
import AdmissionCTA from "@/components/AdmissionCTA";
import Footer from "@/components/Footer";
import VLSTimeline from "@/components/VLSTimeline";
import Impact from "@/components/Impact";
import ProgramsGrid from "@/components/ProgramsGrid";
import StudentPortalDashboard from "./student portal dashboard/page";
export default function Home() {
  return (
    <main className="overflow-hidden">

      <Navbar />
   {/* HERO SECTION */}
<section className="relative pt-24 min-h-[90vh]
   
       
        bg-gradient-to-br
        from-blue-950
        via-blue-800
        to-blue-600
        flex
        items-center
      ">


        {/* Background Effects */}

        <div className="
          absolute
          top-20
          left-10
          w-32
          h-32
          bg-orange-400/20
          rounded-full
          blur-xl
          animate-pulse
        ">
        </div>


        <div className="
          absolute
          bottom-20
          right-20
          w-48
          h-48
          bg-white/10
          rounded-full
          blur-2xl
          animate-bounce
        ">
        </div>



        <div className="
          max-w-7xl
          mx-auto
          px-6
          grid
          lg:grid-cols-2
          gap-12
          items-center
          relative
          z-10
        ">



          {/* LEFT SIDE */}

          <div className="text-white">


            <span className="
              inline-block
              px-5
              py-2
              rounded-full
              bg-white/10
              backdrop-blur-md
              border
              border-white/20
              text-orange-300
              font-semibold
            ">

              Vision Turns Into Mission

            </span>



            <h1 className="
              mt-6
              text-5xl
              md:text-7xl
              font-bold
              leading-tight
            ">

              Empowering Minds.
              <br />
              Building Futures.

            </h1>



            <p className="
              mt-6
              text-lg
              md:text-xl
              text-blue-100
              max-w-xl
            ">

              Veezna creates a complete learning ecosystem where students
              develop knowledge, communication skills, confidence and
              professional abilities for a successful future.

            </p>




            <div className="
              mt-10
              flex
              gap-5
              flex-wrap
            ">


              <button className="
                px-8
                py-4
                rounded-full
                bg-orange-500
                hover:bg-orange-600
                transition
                shadow-xl
                hover:scale-105
                font-semibold
              ">

                Start Your Journey

              </button>



              <button className="
                px-8
                py-4
                rounded-full
                border
                border-white/40
                backdrop-blur-md
                hover:bg-white
                hover:text-blue-800
                transition
                font-semibold
              ">

                Explore Programs

              </button>


            </div>




            <div className="
              mt-12
              flex
              gap-10
            ">


              <div>

                <h3 className="text-3xl font-bold">
                  360°
                </h3>

                <p className="text-blue-200">
                  Learning Approach
                </p>

              </div>



              <div>

                <h3 className="text-3xl font-bold">
                  VLS
                </h3>

                <p className="text-blue-200">
                  Learning System
                </p>

              </div>


            </div>



          </div>





          {/* RIGHT SIDE 3D CARD */}


          <div className="flex justify-center">


            <div className="
              relative
              w-[350px]
              h-[420px]
              rounded-[40px]
              bg-white/10
              backdrop-blur-xl
              border
              border-white/20
              shadow-2xl
              p-8
              rotate-3
              hover:rotate-0
              transition-all
              duration-700
            ">


              <div className="
                absolute
                inset-0
                rounded-[40px]
                bg-gradient-to-br
                from-white/20
                to-transparent
              ">
              </div>



              <div className="
                relative
                z-10
              ">



                {/* LOGO */}

                <div className="
                  w-28
                  h-28
                  rounded-3xl
                  bg-white
                  flex
                  items-center
                  justify-center
                  shadow-2xl
                  p-4
                ">


                  <Image

                    src="/images/veezna-logo.png"

                    alt="Veezna Logo"

                    width={120}

                    height={120}

                    className="
                      object-contain
                    "

                  />


                </div>





                <h2 className="
                  mt-8
                  text-3xl
                  font-bold
                  text-white
                ">

                  Veezna Learning System

                </h2>




                <p className="
                  mt-5
                  text-blue-100
                ">

                  Learn.
                  Grow.
                  Transform.

                </p>




                <div className="
                  mt-8
                  space-y-3
                ">


                  <div className="
                    bg-white/10
                    rounded-xl
                    p-4
                    text-white
                  ">

                    📚 Academic Excellence

                  </div>


                  <div className="
                    bg-white/10
                    rounded-xl
                    p-4
                    text-white
                  ">

                    🗣️ Communication Skills

                  </div>


                  <div className="
                    bg-white/10
                    rounded-xl
                    p-4
                    text-white
                  ">

                    🌱 Personal Growth

                  </div>



                </div>



              </div>



            </div>



          </div>



        </div>


      </section>



   <Courses />

<Pillars />
<VLSTimeline />
<TrustSection />
<Hero />
<AboutVeezna />
<ProgramsGrid/>
<Testimonials />

<AdmissionCTA />
<Impact />
<Footer />


    </main>
  );
}
