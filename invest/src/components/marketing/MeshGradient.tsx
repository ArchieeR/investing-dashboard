export function MeshGradient() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            {/* Base black */}
            <div className="absolute inset-0 bg-[#050505]" />

            {/* Primary orange glow — top right */}
            <div
                className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full opacity-20"
                style={{
                    background: "radial-gradient(circle, rgba(255,107,0,0.4) 0%, rgba(255,107,0,0) 70%)",
                    animation: "float1 20s ease-in-out infinite",
                }}
            />

            {/* Secondary amber glow — bottom left */}
            <div
                className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-15"
                style={{
                    background: "radial-gradient(circle, rgba(255,140,56,0.35) 0%, rgba(255,140,56,0) 70%)",
                    animation: "float2 25s ease-in-out infinite",
                }}
            />

            {/* Subtle warm spot — center */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full opacity-[0.07]"
                style={{
                    background: "radial-gradient(circle, rgba(255,107,0,0.3) 0%, transparent 60%)",
                    animation: "float3 30s ease-in-out infinite",
                }}
            />

            {/* Dark veil overlay with noise texture */}
            <div
                className="absolute inset-0"
                style={{
                    background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)",
                }}
            />
        </div>
    )
}
