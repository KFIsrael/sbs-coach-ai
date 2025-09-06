import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-6xl sm:text-8xl font-bold mb-4 text-gradient-gold">404</h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-6">Страница не найдена</p>
        <p className="text-sm text-muted-foreground mb-6">
          К сожалению, запрашиваемая страница не существует
        </p>
        <a 
          href="/" 
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Вернуться на главную
        </a>
      </div>
    </div>
  );
};

export default NotFound;
