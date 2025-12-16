import LmLogo from "./svg/LmLogo";

const Header = () => {
  return (
    <>
      <div className="h-[54px] px-2 pt-0.5 flex items-center justify-between">
        <div className="ml-4 flex flex-row items-center gap-3">
          <LmLogo />
          <p className="text-[#171717] font-[500] text-[16px]">
            Market Insights AI
          </p>
        </div>
      </div>
    </>
  );
};

export default Header;
