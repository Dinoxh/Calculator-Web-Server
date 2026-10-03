from fastapi import FastAPI, Request, HTTPException
import Calculator as c

app = FastAPI()

variables = {"ans": 0.0,
             "PI": c.math.pi,
             "E": c.math.e
             }

@app.post("/statement")
async def statement_endpoint(request: Request):
    #Decode the request from client
    line = (await request.body()).decode().strip()

    wtok = c.TokenizeWrapper(line)

    #Try to return response
    try:
        result = c.statement(wtok, variables)
        return result

    except c.CalculatorSyntaxError as se:
        raise HTTPException(status_code = 400,
                            detail = f"Syntax Error: Error occurred at token '{wtok.get_current()}' just after token '{wtok.get_previous()}'")

    except c.TokenError as te:
        raise HTTPException(status_code = 400,
                            detail = f"*** Syntax error: Unbalanced parentheses")

    except c.EvaluationError as ee:
        raise HTTPException(status_code = 400,
                            detail = f"Evaluation error: {ee}")
