"use client";

import { useState } from "react";

export default function Navbar() {

  const [open, setOpen] = useState(false);


  return (

    <nav className="
      fixed
      top-0
      left-0
      w-full
      z-50
      backdrop-blur-xl
      bg-white/80
      border-b
      border-gray-200
    ">


      <div className="
        max-w-7xl
        mx-auto
        px-6
        py-4
        flex
        items-center
        justify-between
      ">


        {/* Logo */}

        <div className="
          flex
          items-center
          gap-3
        ">


          <div className="
            w-12
            h-12
            rounded-2xl
            bg-white
            shadow-lg
            flex
            items-center
            justify-center
            overflow-hidden
          ">

            <img
              src="/images/veezna-logo.png"
              alt="Veezna Logo"
              className="
                w-full
                h-full
                object-contain
              "
            />

          </div>


          <h1 className="
            text-2xl
            font-bold
            text-blue-800
          ">
            Veezna
          </h1>


        </div>





        {/* Desktop Menu */}

        <div className="
          hidden
          md:flex
          items-center
          gap-8
          font-medium
          text-gray-700
        ">


          <a 
          href="#home"
          className="hover:text-orange-500 transition"
          >
            Home
          </a>


          <a 
          href="#programs"
          className="hover:text-orange-500 transition"
          >
            Programs
          </a>


          <a 
          href="#about"
          className="hover:text-orange-500 transition"
          >
            About
          </a>


          <a 
          href="#contact"
          className="hover:text-orange-500 transition"
          >
            Contact
          </a>



          <button className="
            bg-orange-500
            text-white
            px-6
            py-3
            rounded-full
            hover:bg-orange-600
            transition
            shadow-lg
          ">

            Join Now

          </button>


        </div>





        {/* Mobile Button */}

        <button

          onClick={()=>setOpen(!open)}

          className="
          md:hidden
          text-3xl
          text-blue-800
          "

        >

          ☰

        </button>


      </div>





      {/* Mobile Menu */}


      {
        open && (

          <div className="
            md:hidden
            bg-white
            px-6
            py-6
            space-y-4
            shadow-lg
          ">


            <a className="block">
              Home
            </a>

            <a className="block">
              Programs
            </a>

            <a className="block">
              About
            </a>

            <a className="block">
              Contact
            </a>


            <button className="
              w-full
              bg-orange-500
              text-white
              py-3
              rounded-full
            ">

              Join Now

            </button>


          </div>

        )
      }


    </nav>

  );

}