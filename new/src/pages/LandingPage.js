import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { FiArrowRight, FiAward, FiUsers, FiTrendingUp } from 'react-icons/fi';

function Model3D() {
  const sphereRef = useRef();
  
  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x += 0.005;
      sphereRef.current.rotation.y += 0.005;
    }
  });

  return (
    <Sphere ref={sphereRef} args={[1, 64, 64]}>
      <MeshDistortMaterial
        color="#4338ca"
        attach="material"
        distort={0.5}
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
}

function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.3 } }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black overflow-hidden">
      {/* Hero Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative min-h-screen"
      >
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 8] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <Model3D />
            <OrbitControls autoRotate />
          </Canvas>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-screen flex flex-col justify-center">
          <motion.div variants={itemVariants} className="text-center mb-20">
            <h1 className="font-['Space_Grotesk'] text-7xl md:text-8xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Skill Exchange & Learning Platform
            </h1>
            <p className="font-['Inter'] text-2xl md:text-3xl mb-12 text-gray-300 max-w-3xl mx-auto">
              A community-driven platform powered by blockchain technology for verified learning and earning
            </p>
            <motion.div 
              className="flex gap-6 justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <Link
                to="/dashboard"
                className="group bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-10 rounded-full flex items-center space-x-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
              >
                <span>Get Started</span>
                <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12"
          >
            <div className="backdrop-blur-lg bg-white/10 p-6 rounded-2xl">
              <FiAward className="text-4xl text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Verified Credentials</h3>
              <p className="text-gray-300">Blockchain-powered certificates that prove your expertise</p>
            </div>
            <div className="backdrop-blur-lg bg-white/10 p-6 rounded-2xl">
              <FiUsers className="text-4xl text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Expert Mentorship</h3>
              <p className="text-gray-300">Connect with verified mentors in your field</p>
            </div>
            <div className="backdrop-blur-lg bg-white/10 p-6 rounded-2xl">
              <FiTrendingUp className="text-4xl text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Token Rewards</h3>
              <p className="text-gray-300">Earn tokens for learning and contributing</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default LandingPage;
