export default function AboutVeezna() {

  return (

    <section className="
      py-24
      bg-gradient-to-br
      from-blue-950
      to-blue-700
      text-white
    ">


      <div className="
        max-w-7xl
        mx-auto
        px-6
        grid
        lg:grid-cols-2
        gap-12
        items-center
      ">


        {/* LEFT CONTENT */}

        <div>


          <span className="
            text-orange-300
            font-semibold
            tracking-wide
          ">

            ABOUT VEEZNA

          </span>



          <h2 className="
            mt-5
            text-4xl
            md:text-5xl
            font-bold
            leading-tight
          ">

            Building Skills.
            <br />
            Creating Possibilities.

          </h2>



          <p className="
            mt-6
            text-blue-100
            text-lg
            leading-relaxed
          ">

            Veezna is a learning and growth ecosystem designed to
            help individuals develop knowledge, confidence and
            practical skills required for personal and professional success.

          </p>



          <p className="
            mt-5
            text-blue-100
            text-lg
            leading-relaxed
          ">

            Through our structured learning approach, we combine
            education, communication, wellness and future-ready skills
            to create meaningful transformation.

          </p>



          <button className="
            mt-8
            px-8
            py-4
            rounded-full
            bg-orange-500
            hover:bg-orange-600
            transition
            font-semibold
            shadow-lg
          ">

            Know More About Veezna

          </button>



        </div>




        {/* RIGHT SIDE CARD */}


        <div className="
          relative
        ">


          <div className="
            bg-white/10
            backdrop-blur-xl
            border
            border-white/20
            rounded-[40px]
            p-10
            shadow-2xl
          ">


            <h3 className="
              text-3xl
              font-bold
            ">

              Our Vision

            </h3>



            <p className="
              mt-5
              text-blue-100
              leading-relaxed
            ">

              To empower learners with clarity, confidence and
              skills that help them achieve their dreams.

            </p>



            <div className="
              mt-8
              space-y-4
            ">


              <div className="
                bg-white/10
                rounded-2xl
                p-5
              ">

                📘 Knowledge Development

              </div>


              <div className="
                bg-white/10
                rounded-2xl
                p-5
              ">

                🌟 Confidence Building

              </div>


              <div className="
                bg-white/10
                rounded-2xl
                p-5
              ">

                🚀 Career Growth

              </div>


            </div>



          </div>


        </div>



      </div>


    </section>

  );

}