import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { redeemVoucher } from "@/db/api";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

export default function TokenLink() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [errorState, setErrorState] = useState(0);

  if (!tokenId || tokenId.length !== 10) {
    return (
      <div className="mb-3 bg-red-600 text-white border-none px-4 py-6 rounded-full text-lg font-bold text-center w-96 mx-auto mt-10">
        {t("الكود غير صالح", "Token is invalid")}
      </div>
    );
  } else if (!user?.id) {
    // navigate("/login", { state: { from: `/tokens/${tokenId}` } });
    return (
      <div className="mb-3 bg-red-600 text-white border-none px-4 py-6 rounded-full text-lg font-bold text-center w-96 mx-auto mt-10">
        {t("لازم تسجل الدخول", "Login Required")}
      </div>
    );
  } else {
    redeemVoucher(tokenId!, user.id!)
      .then(() => {
        setErrorState(0);
      })
      .catch(() => {
        setErrorState(1);
      });
    if (!errorState) {
      // navigate("/my-courses", { state: { from: `/tokens/${tokenId}` } });
      return (
        <div className="mb-3 bg-blue-600 text-white border-none px-4 py-6 rounded-full text-lg font-bold text-center w-96 mx-auto mt-10">
          {t("تم تفعيل الكورس بنجاح", "Course had been activated")}
        </div>
      );
    } else {
      return (
        <div className="mb-3 bg-red-600 text-white border-none px-4 py-6 rounded-full text-lg font-bold text-center w-96 mx-auto mt-10">
          {t("الكود غير صالح", "Token is invalid")}
        </div>
      );
    }
  }
}
