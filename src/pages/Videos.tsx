import Layout from "../components/Layout";

const Videos = () => {
  // Mock data - replace with actual YouTube links
  const videos = [
    { id: "1", title: "Healthy Breakfast Ideas", videoId: "dQw4w9WgXcQ" },
    { id: "2", title: "Quick Workout Routine", videoId: "dQw4w9WgXcQ" },
    { id: "3", title: "Nutrition Tips", videoId: "dQw4w9WgXcQ" },
  ];

  return (
    <Layout>
      <div className="p-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Fitness Videos</h1>
        
        <div className="space-y-4">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={`https://www.youtube.com/embed/${video.videoId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{video.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Videos;