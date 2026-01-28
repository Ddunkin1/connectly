import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const Landing = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#359EFF] via-[#2a8eef] to-[#1e7dd6]">
            {/* Navigation */}
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-[#359EFF] font-bold text-xl">C</span>
                        </div>
                        <span className="text-2xl font-bold text-white">Connectly</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link to="/login">
                            <Button variant="ghost" className="text-white border-white hover:bg-white/10">
                                Sign In
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button className="bg-white text-[#359EFF] hover:bg-gray-100 shadow-lg">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                        Connect, Share, and
                        <br />
                        <span className="text-yellow-300">Grow Together</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
                        Join Connectly - the social platform where meaningful connections happen.
                        Share your thoughts, discover communities, and connect with people who share your passions.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <Link to="/register">
                            <Button size="lg" className="bg-white text-[#359EFF] hover:bg-gray-100 px-10 py-4 text-lg font-semibold shadow-xl transform hover:scale-105 transition-transform">
                                Create Free Account
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-10 py-4 text-lg font-semibold">
                                Sign In
                            </Button>
                        </Link>
                    </div>
                    <p className="text-white/70 mt-6 text-sm">
                        No credit card required • Join thousands of users
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white border border-white/20 hover:bg-white/15 transition-all transform hover:scale-105">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-3xl">groups</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Join Communities</h3>
                        <p className="text-white/80 leading-relaxed">
                            Discover and join communities that match your interests. Connect with like-minded people from around the world.
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white border border-white/20 hover:bg-white/15 transition-all transform hover:scale-105">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-3xl">share</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Share Your Thoughts</h3>
                        <p className="text-white/80 leading-relaxed">
                            Post your ideas, share media, and engage with content that matters to you. Express yourself freely.
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white border border-white/20 hover:bg-white/15 transition-all transform hover:scale-105">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-3xl">favorite</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Engage & Connect</h3>
                        <p className="text-white/80 leading-relaxed">
                            Like, comment, and follow. Build meaningful relationships in a safe and welcoming environment.
                        </p>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 mb-20 border border-white/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">10K+</div>
                            <div className="text-white/80 text-lg">Active Users</div>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">50K+</div>
                            <div className="text-white/80 text-lg">Posts Shared</div>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">500+</div>
                            <div className="text-white/80 text-lg">Communities</div>
                        </div>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mb-20">
                    <h2 className="text-4xl font-bold text-white text-center mb-12">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white border-4 border-white/30">
                                1
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">Create Your Account</h3>
                            <p className="text-white/80">
                                Sign up in seconds with your email. Choose a unique username and start your journey.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white border-4 border-white/30">
                                2
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">Follow & Connect</h3>
                            <p className="text-white/80">
                                Follow people you're interested in and join communities that align with your passions.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white border-4 border-white/30">
                                3
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">Share & Engage</h3>
                            <p className="text-white/80">
                                Share your thoughts, post media, and engage with content. Build your network and grow together.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-white rounded-3xl p-12 md:p-16 text-center shadow-2xl">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Join thousands of users already connecting, sharing, and growing on Connectly.
                        Start your journey today - it's free and takes less than a minute.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <Link to="/register">
                            <Button size="lg" className="bg-[#359EFF] text-white hover:bg-[#2a8eef] px-10 py-4 text-lg font-semibold shadow-lg transform hover:scale-105 transition-transform">
                                Sign Up Free
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button size="lg" variant="outline" className="border-2 border-[#359EFF] text-[#359EFF] hover:bg-[#359EFF] hover:text-white px-10 py-4 text-lg font-semibold">
                                Already have an account?
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-20 text-center text-white/70 text-sm">
                    <p>© 2024 Connectly. All rights reserved.</p>
                    <div className="flex items-center justify-center space-x-6 mt-4">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">About</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Landing;
